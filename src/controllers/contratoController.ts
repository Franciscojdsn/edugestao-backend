import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withTenancy, withEscolaId } from '../utils/prismaHelpers'

// Listar contratos
export const contratoController = {
  async list(req: Request, res: Response) {
    const { page = 1, limit = 20, status, alunoId } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    let where: any = {}
    if (status) where.status = status
    if (alunoId) where.alunoId = alunoId

    where.aluno = { escolaId: req.user?.escolaId, deletedAt: null }

    const [contratos, total] = await Promise.all([
      prisma.contrato.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          aluno: { select: { id: true, nome: true, numeroMatricula: true } },
          responsavelFinanceiro: { select: { id: true, nome: true } },
          _count: { select: { transacoes: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contrato.count({ where }),
    ])

    return res.json({
      data: contratos,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    })
  },

  // Mostrar detalhes de um contrato
  async show(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const contrato = await prisma.contrato.findFirst({
      where: {
        id: idFormatado,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
      include: {
        aluno: {
          select: {
            nome: true,
            numeroMatricula: true,
            turma: { select: { nome: true } },
          },
        },
        responsavelFinanceiro: {
          select: {
            nome: true,
            cpf: true,
            email: true,
          },
        },
        transacoes: {
          select: {
            id: true,
            motivo: true,
            valor: true,
            data: true,
          },
          orderBy: { data: 'asc' },
        },
      },
    })

    if (!contrato) throw new AppError('Contrato não encontrado', 404)
    return res.json(contrato)
  },

  // Criar um novo contrato
  async create(req: Request, res: Response) {
    const dados = req.body
    const escolaId = req.user?.escolaId
    const isStatus = dados.status ? dados.status : 'ATIVO'

    const aluno = await prisma.aluno.findFirst({
      where: withTenancy({ id: dados.alunoId }),
    })
    if (!aluno) throw new AppError('Aluno não encontrado', 404)

    const responsavel = await prisma.responsavel.findFirst({
      where: {
        id: dados.responsavelFinanceiroId,
        alunoId: dados.alunoId,
        isResponsavelFinanceiro: true,
      },
    })
    if (!responsavel) throw new AppError('Responsável financeiro não encontrado ou inválido', 404)

    const contratoExiste = await prisma.contrato.findFirst({
      where: {
        alunoId: dados.alunoId,
        status: isStatus,
      },
    })
    if (contratoExiste) throw new AppError('Aluno já possui contrato ativo', 400)

    const contrato = await prisma.contrato.create({
      data: {
        ...dados,
        escolaId,
        dataInicio: new Date(dados.dataInicio),
        dataFim: dados.dataFim ? new Date(dados.dataFim) : null,
      },
      include: {
        aluno: { select: { nome: true } },
        responsavelFinanceiro: { select: { nome: true } },
      },
    })

    return res.status(201).json(contrato)
  },

  // Atualizar um contrato
  async update(req: Request, res: Response) {
    const { id } = req.params
    const dados = req.body
    const idFormatado = Array.isArray(id) ? id[0] : id

    const contratoExistente = await prisma.contrato.findFirst({
      where: {
        id: idFormatado,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
    })
    if (!contratoExistente) throw new AppError('Contrato não encontrado', 404)

    const contrato = await prisma.contrato.update({
      where: { id: idFormatado },
      data: {
        ...dados,
        dataFim: dados.dataFim ? new Date(dados.dataFim) : undefined,
      },
      include: {
        aluno: { select: { nome: true } },
        responsavelFinanceiro: { select: { nome: true } },
      },
    })

    return res.json(contrato)
  },

  // Cancelar um contrato
  async cancelar(req: Request, res: Response) {
    const dados = req.body
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id
    const isStatus = dados.status ? dados.status : 'CANCELADO'

    const contrato = await prisma.contrato.findFirst({
      where: {
        id: idFormatado,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
    })
    if (!contrato) throw new AppError('Contrato não encontrado', 404)

    const contratoAtualizado = await prisma.contrato.update({
      where: { id: idFormatado },
      data: {
        status: isStatus,
        dataFim: new Date(),
      },
    })

    return res.json(contratoAtualizado)
  },

  /**
   * POST /contratos/:id/suspender
   * Suspende o contrato, cancela boletos futuros pendentes e gera auditoria.
   */
  async suspender(req: Request, res: Response) {
    const { id } = req.params
    const { motivo } = req.body
    const escolaId = req.user?.escolaId

    if (!escolaId) {
      throw new AppError('Escola ID não encontrado no contexto de autenticação', 400)
    }

    // 1. Busca contrato atual para validar posse e guardar snapshot para auditoria
    const contratoAtual = await prisma.contrato.findFirst({
      where: {
        id: id as string,
        escolaId, // Regra de Ouro: Multi-tenant
        ativo: true, // Só processa se estiver ativo
      },
      include: {
        aluno: { select: { id: true, nome: true } }
      }
    })

    if (!contratoAtual) {
      throw new AppError('Contrato não encontrado, não pertence à escola ou já está inativo.', 404)
    }

    if (contratoAtual.status === 'SUSPENSO') {
      throw new AppError('Este contrato já se encontra suspenso.', 400)
    }

    // 2. Transação Atômica (Prisma v7+)
    const resultado = await prisma.$transaction(async (tx) => {
      const hoje = new Date()

      // A. Atualiza o Contrato
      const contratoSuspenso = await tx.contrato.update({
        where: { id: contratoAtual.id },
        data: {
          status: 'SUSPENSO',
          ativo: false,
          dataFim: hoje
        }
      })

      // B. Cancela os Boletos (Imutabilidade Financeira)
      const notaCancelamento = motivo
        ? `Cancelado por suspensão de contrato. Motivo: ${motivo}`
        : 'Cancelado por suspensão de contrato.'

      const boletosCancelados = await tx.boletos.updateMany({
        where: {
          escolaId,
          alunoId: contratoAtual.alunoId,
          status: 'PENDENTE',
          dataVencimento: { gt: hoje } // Apenas boletos a vencer
        },
        data: {
          status: 'CANCELADO',
          observacoes: notaCancelamento
        }
      })

      // C. Registro Rigoroso de Auditoria
      await tx.logAuditoria.create({
        data: {
          entidade: 'Contrato',
          entidadeId: contratoAtual.id,
          acao: 'SUSPENSAO_CONTRATO',
          dadosAntigos: JSON.parse(JSON.stringify({ status: contratoAtual.status, ativo: contratoAtual.ativo })),
          dadosNovos: JSON.parse(JSON.stringify({
            status: 'SUSPENSO',
            ativo: false,
            boletosCancelados: boletosCancelados.count,
            motivo
          })),
          escolaId,
          ip: req.ip || null
        }
      })

      // D. Desvincular o aluno da turma
      await tx.aluno.update({
        where: {
          id: contratoAtual.alunoId,
          escolaId // Regra de Ouro: Sempre filtrar por escolaId
        },
        data: {
          turmaId: null,
        }
      });

      return {
        contrato: contratoSuspenso,
        boletosAfetados: boletosCancelados.count
      }
    })

    return res.status(200).json({
      message: 'Contrato suspenso com sucesso.',
      data: resultado
    })
  },
}