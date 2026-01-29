import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withTenancy, withEscolaId } from '../utils/prismaHelpers'

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
}