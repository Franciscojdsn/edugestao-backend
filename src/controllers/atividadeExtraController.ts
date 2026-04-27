import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withEscolaId, withTenancy } from '../utils/prismaHelpers'

export const atividadeExtraController = {

  // GET /atividades
  async list(req: Request, res: Response) {
    const atividades = await prisma.atividadeExtra.findMany({
      select: {
        id: true,
        nome: true,
        descricao: true,
        valor: true,
        diaAula: true,
        horario: true,
        capacidadeMaxima: true,
        createdAt: true,
        _count: { select: { alunos: { where: { ativo: true } } } },
      },
      orderBy: { nome: 'asc' },
    })

    const atividadesComVagas = atividades.map(a => ({
      ...a,
      totalAlunosAtivos: a._count.alunos,
      vagasDisponiveis: a.capacidadeMaxima ? Math.max(0, a.capacidadeMaxima - a._count.alunos) : null,
    }))

    return res.json({ status: 'success', data: atividadesComVagas })
  },

  // GET /atividades/:id
  async show(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const atividade = await prisma.atividadeExtra.findFirst({
      where: { id: idFormatado }
    })

    if (!atividade) throw new AppError('Atividade não encontrada', 404)

    return res.json({ status: 'success', data: atividade })
  },

  // POST /atividades
  async create(req: Request, res: Response) {
    const dados = req.body

    const novaAtividade = await prisma.atividadeExtra.create({
      data: dados
    })

    return res.status(201).json({ status: 'success', data: novaAtividade })
  },

  // PUT /atividades/:id
  async update(req: Request, res: Response) {
    // CORREÇÃO: Desestruturando para extrair a string exata do ID
    const { id } = req.params;
    const { atualizarBoletosPendentes, ...dados } = req.body;
    const escolaId = req.user?.escolaId;
    const hoje = new Date();

    // 1. Verificar se a atividade existe
    const atividadeExistente = await prisma.atividadeExtra.findFirst({
      where: { id: String(id), escolaId },
    });

    if (!atividadeExistente) throw new AppError('Atividade não encontrada', 404);

    // 2. Verificar nome duplicado (se houver alteração de nome)
    if (dados.nome && dados.nome !== atividadeExistente.nome) {
      const nomeEmUso = await prisma.atividadeExtra.findFirst({
        where: {
          nome: dados.nome,
          escolaId,
          id: { not: String(id) } // Agora o 'id' é uma string válida para o Prisma
        },
      });
      if (nomeEmUso) throw new AppError('Nome já está em uso', 400);
    }

    // 3. Atualizar a atividade
    const atividadeAtualizada = await prisma.atividadeExtra.update({
      where: { id: String(id) },
      data: {
        nome: dados.nome,
        descricao: dados.descricao,
        valor: dados.valor !== undefined ? Number(dados.valor) : undefined,

        // Novos campos
        diaAula: dados.diaAula,
        horario: dados.horario,
        capacidadeMaxima: dados.capacidadeMaxima ? Number(dados.capacidadeMaxima) : null,
      }
    });

    // 4. Lógica de Recálculo Financeiro
    if (atualizarBoletosPendentes && dados.valor && Number(dados.valor) !== Number(atividadeExistente.valor)) {

      const boletosParaAtualizar = await prisma.boletos.findMany({
        where: {
          status: 'PENDENTE',
          dataVencimento: { gt: hoje },
          aluno: {
            atividadesExtra: {
              some: { atividadeExtraId: String(id) }
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
      });

      // Processa cada boleto afetado
      for (const boleto of boletosParaAtualizar) {
        const aluno = boleto.aluno;
        if (!aluno) continue;

        // Tenta pegar o contrato 
        const contrato = Array.isArray(aluno.contrato) ? aluno.contrato : aluno.contrato;

        if (!contrato) continue;

        // Convertendo para número com segurança 
        const valorBase = Number(contrato.valorMensalidadeBase);
        const valorDesconto = Number(contrato.descontoMensalidade || 0);

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

    return res.json(atividadeAtualizada);
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
    const atividadeId = String(req.params.atividadeId)
    const { alunoId } = req.body

    // 1. Validação Dupla de Existência
    const [aluno, atividade] = await Promise.all([
      prisma.aluno.findFirst({ where: { id: alunoId } }),
      prisma.atividadeExtra.findFirst({
        where: { id: atividadeId },
        include: { _count: { select: { alunos: { where: { ativo: true } } } } }
      })
    ])

    if (!aluno) throw new AppError('Aluno não encontrado.', 404)
    if (!atividade) throw new AppError('Atividade não encontrada.', 404)

    // 2. Trava de Capacidade
    if (atividade.capacidadeMaxima && atividade._count.alunos >= atividade.capacidadeMaxima) {
      throw new AppError('A atividade já atingiu a capacidade máxima de alunos.', 400)
    }

    // 3. Trava de Duplicidade
    const vinculoExistente = await prisma.alunoAtividadeExtra.findFirst({
      where: { alunoId, atividadeExtraId: atividadeId }
    })

    if (vinculoExistente) {
      if (vinculoExistente.ativo) throw new AppError('Aluno já está vinculado e ativo nesta atividade.', 400)

      // Reativa o vínculo caso estivesse inativo
      const reativado = await prisma.alunoAtividadeExtra.update({
        where: { id: vinculoExistente.id },
        data: { ativo: true, dataFim: null }
      })
      return res.json({ status: 'success', message: 'Vínculo reativado.', data: reativado })
    }

    // 4. Criação do Vínculo
    const novoVinculo = await prisma.alunoAtividadeExtra.create({
      data: {
        alunoId,
        atividadeExtraId: atividadeId,
        ativo: true
        // escolaId será injetado pela extensão
      }
    })

    // ATENÇÃO: Dependendo da regra de negócio, a inclusão aqui 
    // deveria disparar a recalcularBoletos(alunoId) no motor financeiro.

    return res.status(201).json({ status: 'success', message: 'Aluno vinculado com sucesso.', data: novoVinculo })
  },

  // DELETE /atividades/:atividadeId/alunos/:alunoId
  async desvincularAluno(req: Request, res: Response) {
    const { atividadeId, alunoId } = req.params

    const vinculo = await prisma.alunoAtividadeExtra.findFirst({
      where: {
        alunoId: String(alunoId),
        atividadeExtraId: String(atividadeId)
      }
    })

    if (!vinculo) throw new AppError('Vínculo não encontrado.', 404)

    // A regra de Imutabilidade e Histórico dita que fazemos Soft Delete / Desativação
    await prisma.alunoAtividadeExtra.update({
      where: { id: vinculo.id },
      data: {
        ativo: false,
        dataFim: new Date()
      }
    })

    return res.json({ status: 'success', message: 'Aluno desvinculado com sucesso.' })
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