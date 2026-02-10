import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withEscolaId, withTenancy } from '../utils/prismaHelpers'

export const atividadeExtraController = {

  // GET /atividades
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

  // GET /atividades/:id
  async show(req: Request, res: Response) {
    const id = req.params;

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

  // POST /atividades
  async create(req: Request, res: Response) {
    const dados = req.body
    const escolaId = req.user?.escolaId

    if (!escolaId) throw new AppError('Escola não identificada', 401)

    const atividadeExiste = await prisma.atividadeExtra.findFirst({
      where: {
        nome: dados.nome,
        escolaId: escolaId
      },
    })

    if (atividadeExiste) throw new AppError('Atividade com este nome já existe', 400)

    const atividade = await prisma.atividadeExtra.create({
      data: { ...dados, escolaId },
    })

    return res.status(201).json(atividade)
  },

  // PUT /atividades/:id
  async update(req: Request, res: Response) {
    const id = req.params;
    const { atualizarBoletosPendentes, ...dados } = req.body
    const escolaId = req.user?.escolaId
    const hoje = new Date()

    // 1. Verificar se a atividade existe
    const atividadeExistente = await prisma.atividadeExtra.findFirst({
      where: { id, escolaId },
    })

    if (!atividadeExistente) throw new AppError('Atividade não encontrada', 404)

    // 2. Verificar nome duplicado (se houver alteração de nome)
    if (dados.nome && dados.nome !== atividadeExistente.nome) {
      const nomeEmUso = await prisma.atividadeExtra.findFirst({
        where: {
          nome: dados.nome,
          escolaId,
          id: { not: id }
        },
      })
      if (nomeEmUso) throw new AppError('Nome já está em uso', 400)
    }

    // 3. Atualizar a atividade
    const atividade = await prisma.atividadeExtra.update({
      where: { id: String(id) },
      data: dados,
    })

    // 4. Lógica de Recálculo Financeiro
    if (atualizarBoletosPendentes && dados.valor && Number(dados.valor) !== Number(atividadeExistente.valor)) {

      const boletosParaAtualizar = await prisma.boletos.findMany({
        where: {
          status: 'PENDENTE',
          dataVencimento: { gt: hoje },
          aluno: {
            atividadesExtra: {
              some: { atividadeExtraId: id }
            }
          }
        },
        include: {
          aluno: {
            include: {
              contrato: { where: { ativo: true } },
              atividadesExtra: { include: { atividadeExtra: true } }
            }
          }
        }
      })

      // Processa cada boleto afetado
      for (const boleto of boletosParaAtualizar) {
        // CORREÇÃO: Removido o [0]. 
        // Se no seu schema for 1:1, acesse direto. 
        // Se for 1:N, verifique se o nome no include é 'contrato' ou 'contratos'
        const aluno = boleto.aluno;
        if (!aluno) continue;

        // Tenta pegar o contrato (ajuste 'contrato' para o nome exato que está no seu include/prisma)
        const contrato = Array.isArray(aluno.contrato) ? aluno.contrato[0] : aluno.contrato;

        if (!contrato) continue;

        // Convertendo para número com segurança (Decimal do Prisma para Number do JS)
        const valorBase = Number(contrato.valorMensalidade);
        const valorDesconto = Number(contrato.valorDesconto || 0);

        // Tipagem explícita 'any' ou a Interface do Prisma para o 'item' do reduce
        const novoValorAtividades = aluno.atividadesExtra.reduce((acc: number, item: any) => {
          const valorItem = item.atividadeExtraId === id
            ? Number(dados.valor)
            : Number(item.atividadeExtra.valor);
          return acc + valorItem;
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

  // DELETE /atividades/:id
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const escolaId = req.user?.escolaId;

    const atividade = await prisma.atividadeExtra.findFirst({
      where: { id: String(id), escolaId },
      include: { _count: { select: { alunos: true } } },
    })

    if (!atividade) throw new AppError('Atividade não encontrada', 404)

    // CORREÇÃO LINHA 169: Verificação segura
    if (atividade._count && atividade._count.alunos > 0) {
      throw new AppError(`Não é possível excluir: existem ${atividade._count.alunos} alunos matriculados.`, 400)
    }

    await prisma.atividadeExtra.delete({ where: { id: String(id) } })
    return res.status(204).send()
  },

  // POST /atividades/:atividadeId/alunos
  async vincularAluno(req: Request, res: Response) {
    // Extração corrigida para bater com a rota
    const { atividadeId } = req.params;
    const { alunoId } = req.body;
    const escolaId = req.user?.escolaId;

    if (!atividadeId || !alunoId) {
      throw new AppError('Dados incompletos', 400);
    }

    // 1. Validar Atividade
    const atividade = await prisma.atividadeExtra.findFirst({
      where: { id: String(atividadeId), escolaId },
      include: { _count: { select: { alunos: true } } },
    })

    if (!atividade) throw new AppError('Atividade não encontrada', 404)

    // 2. Validar Aluno
    const aluno = await prisma.aluno.findFirst({
      where: { id: String(alunoId), escolaId },
    })

    if (!aluno) throw new AppError('Aluno não encontrado', 404)

    // 3. Verificar Duplicidade
    const vinculoExiste = await prisma.alunoAtividadeExtra.findUnique({
      where: {
        alunoId_atividadeExtraId: {
          alunoId: String(alunoId),
          atividadeExtraId: String(atividadeId)
        }
      },
    })

    if (vinculoExiste) throw new AppError('Aluno já matriculado nesta atividade', 400)

    // 4. Verificar Capacidade
    if (atividade.capacidadeMaxima && atividade._count.alunos >= atividade.capacidadeMaxima) {
      throw new AppError('Capacidade máxima atingida', 400)
    }

    // 5. Criar Vínculo
    // CORREÇÃO LINHAS 250-251: Uso explícito das chaves
    const vinculo = await prisma.alunoAtividadeExtra.create({
      data: {
        alunoId: String(alunoId),
        atividadeExtraId: String(atividadeId)
      },
      include: {
        aluno: { select: { nome: true, numeroMatricula: true } },
        atividadeExtra: { select: { nome: true, valor: true } },
      },
    })

    return res.status(201).json(vinculo)
  },

  // DELETE /atividades/:atividadeId/alunos/:alunoId
  async desvincularAluno(req: Request, res: Response) {
    const { atividadeId, alunoId } = req.params;

    // CORREÇÃO LINHA 269: Uso correto da chave composta no Prisma
    const vinculo = await prisma.alunoAtividadeExtra.findUnique({
      where: {
        alunoId_atividadeExtraId: {
          alunoId: String(alunoId),
          atividadeExtraId: String(atividadeId)
        }
      },
    })

    if (!vinculo) throw new AppError('Vínculo não encontrado', 404)

    await prisma.alunoAtividadeExtra.delete({
      where: {
        alunoId_atividadeExtraId: {
          alunoId: String(alunoId),
          atividadeExtraId: String(atividadeId)
        }
      },
    })

    return res.status(204).send()
  },

  // GET /atividades/:atividadeId/alunos
  async alunosDaAtividade(req: Request, res: Response) {
    const { atividadeId } = req.params;
    const escolaId = req.user?.escolaId;

    const atividade = await prisma.atividadeExtra.findFirst({
      where: { id: String(atividadeId), escolaId },
    })

    if (!atividade) throw new AppError('Atividade não encontrada', 404)

    const alunosVinculados = await prisma.alunoAtividadeExtra.findMany({
      where: { atividadeExtraId: String(atividadeId) },
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
      alunos: alunosVinculados.map(v => v.aluno),
      total: alunosVinculados.length,
    })
  },
}