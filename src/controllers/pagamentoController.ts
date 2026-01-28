import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withTenancy } from '../utils/prismaHelpers'

export const pagamentoController = {
  async list(req: Request, res: Response) {
    const { page = 1, limit = 20, alunoId, status } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    let where: any = {}
    
    if (alunoId) where.alunoId = alunoId
    if (status) where.status = status

    where.aluno = {
      escolaId: req.user?.escolaId,
      deletedAt: null,
    }

    const [pagamentos, total] = await Promise.all([
      prisma.pagamento.findMany({
        where,
        skip,
        take: Number(limit),
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
        orderBy: { dataVencimento: 'desc' },
      }),
      prisma.pagamento.count({ where }),
    ])

    return res.json({
      data: pagamentos,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    })
  },

  async show(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const pagamento = await prisma.pagamento.findFirst({
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
            responsaveis: {
              select: { nome: true, telefone1: true, email: true, tipo: true },
            },
          },
        },
      },
    })

    if (!pagamento) throw new AppError('Pagamento não encontrado', 404)
    return res.json(pagamento)
  },

  async create(req: Request, res: Response) {
    const { alunoId, referencia, valorTotal, dataVencimento } = req.body

    const aluno = await prisma.aluno.findFirst({
      where: withTenancy({ id: alunoId }),
    })
    if (!aluno) throw new AppError('Aluno não encontrado', 404)

    // Extrair mês e ano da referência (formato: "01/2026")
    const [mes, ano] = referencia.split('/')
    
    const pagamento = await prisma.pagamento.create({
      data: {
        alunoId,
        referencia,
        mesReferencia: parseInt(mes),
        anoReferencia: parseInt(ano),
        valorBase: valorTotal,
        valorAtividades: 0,
        valorTotal,
        dataVencimento: new Date(dataVencimento),
      },
      include: {
        aluno: { select: { nome: true, numeroMatricula: true } },
      },
    })

    return res.status(201).json(pagamento)
  },

  async update(req: Request, res: Response) {
    const { id } = req.params
    const dados = req.body
    const idFormatado = Array.isArray(id) ? id[0] : id

    const pagamentoExistente = await prisma.pagamento.findFirst({
      where: {
        id: idFormatado,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
    })
    if (!pagamentoExistente) throw new AppError('Pagamento não encontrado', 404)

    const pagamento = await prisma.pagamento.update({
      where: { id: idFormatado },
      data: {
        ...dados,
        dataPagamento: dados.dataPagamento ? new Date(dados.dataPagamento) : undefined,
      },
    })

    return res.json(pagamento)
  },

  async registrarPagamento(req: Request, res: Response) {
    const { id } = req.params
    const { dataPagamento, valorPago } = req.body
    const idFormatado = Array.isArray(id) ? id[0] : id

    const pagamento = await prisma.pagamento.findFirst({
      where: {
        id: idFormatado,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
    })
    if (!pagamento) throw new AppError('Pagamento não encontrado', 404)
    if (pagamento.status === 'PAGO') throw new AppError('Pagamento já foi registrado', 400)

    const pagamentoAtualizado = await prisma.pagamento.update({
      where: { id: idFormatado },
      data: {
        status: 'PAGO',
        dataPagamento: new Date(dataPagamento),
        valorPago,
      },
    })

    return res.json(pagamentoAtualizado)
  },

  async cancelar(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const pagamento = await prisma.pagamento.findFirst({
      where: {
        id: idFormatado,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
    })
    if (!pagamento) throw new AppError('Pagamento não encontrado', 404)
    if (pagamento.status === 'PAGO') throw new AppError('Não é possível cancelar pagamento já registrado', 400)

    await prisma.pagamento.update({
      where: { id: idFormatado },
      data: { status: 'CANCELADO' },
    })

    return res.json({ message: 'Pagamento cancelado' })
  },

  async inadimplentes(req: Request, res: Response) {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const pagamentosVencidos = await prisma.pagamento.findMany({
      where: {
        status: 'PENDENTE',
        dataVencimento: { lt: hoje },
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            numeroMatricula: true,
            turma: { select: { nome: true } },
            responsaveis: {
              where: { isResponsavelFinanceiro: true },
              select: { nome: true, telefone1: true, email: true },
            },
          },
        },
      },
      orderBy: { dataVencimento: 'asc' },
    })

    const inadimplenciasPorAluno = pagamentosVencidos.reduce((acc: any, pag) => {
      const alunoId = pag.aluno.id
      if (!acc[alunoId]) {
        acc[alunoId] = {
          aluno: pag.aluno,
          responsavel: pag.aluno.responsaveis[0] || null,
          pagamentosVencidos: [],
          totalDevido: 0,
        }
      }
      acc[alunoId].pagamentosVencidos.push({
        id: pag.id,
        referencia: pag.referencia,
        valorTotal: pag.valorTotal,
        dataVencimento: pag.dataVencimento,
        diasAtraso: Math.floor((hoje.getTime() - new Date(pag.dataVencimento).getTime()) / (1000 * 60 * 60 * 24)),
      })
      acc[alunoId].totalDevido += Number(pag.valorTotal)
      return acc
    }, {})

    const inadimplentes = Object.values(inadimplenciasPorAluno).map((item: any) => ({
      ...item,
      totalDevido: Number(item.totalDevido.toFixed(2)),
      quantidadePagamentos: item.pagamentosVencidos.length,
    }))

    return res.json({
      total: inadimplentes.length,
      totalGeral: Number(inadimplentes.reduce((s, i) => s + i.totalDevido, 0).toFixed(2)),
      inadimplentes,
    })
  },
}