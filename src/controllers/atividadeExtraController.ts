import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withEscolaId, withTenancy } from '../utils/prismaHelpers'



export const atividadeExtraController = {

  // GET /atividades - Listar todas as atividades extras
  async list(req: Request, res: Response) {
    const atividades = await prisma.atividadeExtra.findMany({
      where: withEscolaId({}),
      select: {
        id: true,
        nome: true,
        descricao: true,
        valor: true,
        diaAula: true,
        horario: true,
        capacidadeMaxima: true,
        createdAt: true,
        _count: { select: { alunos: true } },
      },
      orderBy: { nome: 'asc' },
    })

    const atividadesComVagas = atividades.map(a => ({
      ...a,
      totalAlunos: a._count.alunos,
      vagas: a.capacidadeMaxima ? a.capacidadeMaxima - a._count.alunos : null,
    }))

    return res.json({ data: atividadesComVagas, total: atividades.length })
  },

  // GET /atividades/:id - Obter detalhes de uma atividade extra específica
  async show(req: Request, res: Response) {
    const id = req.params.id as any;

    const atividade = await prisma.atividadeExtra.findFirst({
      where: withEscolaId({ id }),
      include: {
        alunos: {
          include: {
            aluno: {
              select: {
                id: true,
                nome: true,
                numeroMatricula: true,
                turma: { select: { nome: true } },
              },
            },
          },
        },
        _count: { select: { alunos: true } },
      },
    })

    if (!atividade) throw new AppError('Atividade não encontrada', 404)
    return res.json(atividade)
  },

  // POST /atividades - Criar uma nova atividade extra
  async create(req: Request, res: Response) {
    const dados = req.body
    const escolaId = req.user?.escolaId

    const atividadeExiste = await prisma.atividadeExtra.findFirst({
      where: withEscolaId({ nome: dados.nome }),
    })
    if (atividadeExiste) throw new AppError('Atividade com este nome já existe', 400)

    const atividade = await prisma.atividadeExtra.create({
      data: { ...dados, escolaId },
    })

    return res.status(201).json(atividade)
  },

  // PUT /atividades/:id - Atualizar uma atividade extra existente
  async update(req: Request, res: Response) {
    const { id, atividadeId } = req.params.id as any;
    const { atualizarBoletosPendentes, ...dados } = req.body
    const hoje = new Date()

    const atividadeExistente = await prisma.atividadeExtra.findFirst({
      where: withEscolaId({ id }),
    })
    if (!atividadeExistente) throw new AppError('Atividade não encontrada', 404)

    if (dados.nome && dados.nome !== atividadeExistente.nome) {
      const nomeEmUso = await prisma.atividadeExtra.findFirst({
        where: withEscolaId({ nome: dados.nome, id: { not: id } }),
      })
      if (nomeEmUso) throw new AppError('Nome já está em uso', 400)
    }

    const atividade = await prisma.atividadeExtra.update({
      where: { id },
      data: dados,
    })

    // 2. Lógica de Reajuste em Boletos Futuros
    // Só executa se o valor mudou e o usuário solicitou a atualização
    if (atualizarBoletosPendentes && dados.valor && Number(dados.valor) !== Number(atividadeExistente.valor)) {

      // Busca boletos PENDENTES com vencimento MAIOR que hoje
      const boletosParaAtualizar = await prisma.boletos.findMany({
        where: {
          status: 'PENDENTE',
          dataVencimento: { gt: hoje },
          aluno: {
            atividadesExtra: {
              some: { atividadeExtraId: atividadeId }
            }
          }
        },
        include: {
          aluno: {
            include: {
              // Pegamos o contrato ativo para recalcular o valor base e desconto
              contrato: { where: { ativo: true } },
              // Pegamos todas as atividades do aluno para somar o novo total
              atividadesExtra: { include: { atividadeExtra: true } }
            }
          }
        }
      })

      // 3. Processar as atualizações
      for (const boleto of boletosParaAtualizar) {
        // Fazemos um cast seguro para garantir que o TS veja as relações incluídas
        const b = boleto as any;

        const contrato = b.aluno?.contratos?.[0];
        if (!contrato) continue;

        const valorBase = Number(contrato.valorMensalidade);
        const valorDesconto = Number(contrato.valorDesconto || 0);

        // Soma todas as atividades (a que mudamos já virá com valor novo do banco)
        const novoValorAtividades = b.aluno.atividadesExtra.reduce((acc: number, item: any) => {
          return acc + (Number(item.atividadeExtra.valor) || 0);
        }, 0);

        const novoValorTotal = (valorBase + novoValorAtividades) - valorDesconto;

        await prisma.boletos.update({
          where: { id: boleto.id },
          data: {
            valorAtividades: novoValorAtividades,
            valorTotal: novoValorTotal
          }
        });
      }
    }

    return res.json(atividade)
  },

  // DELETE /atividades/:id - Soft Deletar uma atividade extra
  async delete(req: Request, res: Response) {
    const id = req.params.id as any;

    const atividade = await prisma.atividadeExtra.findFirst({
      where: withEscolaId({ id }),
      include: { _count: { select: { alunos: true } } },
    })
    if (!atividade) throw new AppError('Atividade não encontrada', 404)

    if (atividade._count.alunos > 0) {
      throw new AppError(
        `Não é possível deletar atividade com ${atividade._count.alunos} aluno(s) matriculado(s)`,
        400
      )
    }

    await prisma.atividadeExtra.delete({ where: { id } })
    return res.status(204).send()
  },

  // POST /atividades/:atividadeId/vincular - Vincular um aluno a uma atividade extra
  async vincularAluno(req: Request, res: Response) {
    const atividadeId = req.params.id as any;
    const alunoId = req.body.id as any;

    const atividade = await prisma.atividadeExtra.findFirst({
      where: withEscolaId({ id: atividadeId }),
      include: { _count: { select: { alunos: true } } },
    })
    if (!atividade) throw new AppError('Atividade não encontrada', 404)

    const aluno = await prisma.aluno.findFirst({
      where: withTenancy({ id: alunoId }),
    })
    if (!aluno) throw new AppError('Aluno não encontrado', 404)

    const vinculoExiste = await prisma.alunoAtividadeExtra.findUnique({
      where: { alunoId_atividadeExtraId: { alunoId: alunoId, atividadeExtraId: atividadeId } },
    })
    if (vinculoExiste) throw new AppError('Aluno já matriculado nesta atividade', 400)

    if (atividade.capacidadeMaxima && atividade._count.alunos >= atividade.capacidadeMaxima) {
      throw new AppError('Atividade já está com capacidade máxima', 400)
    }

    const vinculo = await prisma.alunoAtividadeExtra.create({
      data: { alunoId: alunoId, atividadeExtraId: atividadeId },
      include: {
        aluno: { select: { nome: true, numeroMatricula: true } },
        atividadeExtra: { select: { nome: true, valor: true } },
      },
    })

    return res.status(201).json(vinculo)
  },

  // DELETE /atividades/:atividadeId/desvincular/:alunoId - Desvincular um aluno de uma atividade extra
  async desvincularAluno(req: Request, res: Response) {
    const { atividadeId, alunoId } = req.params.id as any;

    const vinculo = await prisma.alunoAtividadeExtra.findUnique({
      where: { alunoId_atividadeExtraId: { alunoId: alunoId, atividadeExtraId: atividadeId } },
    })
    if (!vinculo) throw new AppError('Vínculo não encontrado', 404)

    await prisma.alunoAtividadeExtra.delete({
      where: { alunoId_atividadeExtraId: { alunoId: alunoId, atividadeExtraId: atividadeId } },
    })

    return res.status(204).send()
  },

  // GET /atividades/:atividadeId/alunos - Listar alunos vinculados a uma atividade extra
  async alunosDaAtividade(req: Request, res: Response) {
    const atividadeId = req.params.id as any;

    const atividade = await prisma.atividadeExtra.findFirst({
      where: withEscolaId({ id: atividadeId }),
    })
    if (!atividade) throw new AppError('Atividade não encontrada', 404)

    const alunos = await prisma.alunoAtividadeExtra.findMany({
      where: { atividadeExtraId: atividadeId },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            numeroMatricula: true,
            turma: { select: { nome: true } },
          },
        },
      },
      orderBy: { aluno: { nome: 'asc' } },
    })

    return res.json({
      atividade: { id: atividade.id, nome: atividade.nome },
      alunos: alunos.map(v => v.aluno),
      total: alunos.length,
    })
  },
}