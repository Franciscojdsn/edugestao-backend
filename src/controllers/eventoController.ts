import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withEscolaId } from '../utils/prismaHelpers'

export const eventoController = {
  async create(req: Request, res: Response) {
    const dados = req.body
    const escolaId = req.user?.escolaId

    if (dados.turmaId) {
      const turma = await prisma.turma.findFirst({ where: withEscolaId({ id: dados.turmaId }) })
      if (!turma) throw new AppError('Turma não encontrada', 404)
    }

    if (dados.dataFim && new Date(dados.dataFim) < new Date(dados.dataInicio)) {
      throw new AppError('Data de fim não pode ser anterior à data de início', 400)
    }

    const evento = await prisma.evento.create({
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao || null,
        tipo: dados.tipo,
        dataInicio: new Date(dados.dataInicio),
        dataFim: dados.dataFim ? new Date(dados.dataFim) : null,
        horaInicio: dados.horaInicio || null,
        horaFim: dados.horaFim || null,
        diaLetivo: dados.diaLetivo ?? true,
        publico: dados.publico ?? true,
        turmaId: dados.turmaId || null,
        escolaId: escolaId!,
      },
      include: { turma: { select: { nome: true } } },
    })

    return res.status(201).json(evento)
  },

  async list(req: Request, res: Response) {
    const { page = 1, limit = 50, tipo, turmaId, dataInicio, dataFim, publico } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    let where: any = { escolaId: req.user?.escolaId }
    if (tipo) where.tipo = tipo
    if (turmaId) where.turmaId = turmaId
    if (publico !== undefined) where.publico = publico

    if (dataInicio || dataFim) {
      where.dataInicio = {}
      if (dataInicio) where.dataInicio.gte = new Date(dataInicio as string)
      if (dataFim) where.dataInicio.lte = new Date(dataFim as string)
    }

    const [eventos, total] = await Promise.all([
      prisma.evento.findMany({
        where,
        skip,
        take: Number(limit),
        include: { turma: { select: { nome: true } } },
        orderBy: { dataInicio: 'asc' },
      }),
      prisma.evento.count({ where }),
    ])

    return res.json({
      data: eventos,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    })
  },

  async show(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const evento = await prisma.evento.findFirst({
      where: { id: idFormatado, escolaId: req.user?.escolaId },
      include: { turma: { select: { nome: true } } },
    })

    if (!evento) throw new AppError('Evento não encontrado', 404)
    return res.json(evento)
  },

  async update(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id
    const dados = req.body

    const evento = await prisma.evento.findFirst({
      where: { id: idFormatado, escolaId: req.user?.escolaId },
    })
    if (!evento) throw new AppError('Evento não encontrado', 404)

    const dataInicio = dados.dataInicio ? new Date(dados.dataInicio) : evento.dataInicio
    const dataFim = dados.dataFim ? new Date(dados.dataFim) : evento.dataFim
    if (dataFim && dataFim < dataInicio) {
      throw new AppError('Data de fim não pode ser anterior à data de início', 400)
    }

    const updateData: any = {}
    if (dados.titulo) updateData.titulo = dados.titulo
    if (dados.descricao !== undefined) updateData.descricao = dados.descricao
    if (dados.tipo) updateData.tipo = dados.tipo
    if (dados.dataInicio) updateData.dataInicio = new Date(dados.dataInicio)
    if (dados.dataFim) updateData.dataFim = new Date(dados.dataFim)
    if (dados.horaInicio !== undefined) updateData.horaInicio = dados.horaInicio
    if (dados.horaFim !== undefined) updateData.horaFim = dados.horaFim
    if (dados.diaLetivo !== undefined) updateData.diaLetivo = dados.diaLetivo
    if (dados.publico !== undefined) updateData.publico = dados.publico
    if (dados.turmaId !== undefined) updateData.turmaId = dados.turmaId

    const atualizado = await prisma.evento.update({ where: { id: idFormatado }, data: updateData })
    return res.json(atualizado)
  },

  async delete(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const evento = await prisma.evento.findFirst({
      where: { id: idFormatado, escolaId: req.user?.escolaId },
    })
    if (!evento) throw new AppError('Evento não encontrado', 404)

    await prisma.evento.delete({ where: { id: idFormatado } })
    return res.status(204).send()
  },

  async proximosEventos(req: Request, res: Response) {
    const hoje = new Date()
    const em7Dias = new Date(hoje)
    em7Dias.setDate(em7Dias.getDate() + 7)

    const eventos = await prisma.evento.findMany({
      where: {
        escolaId: req.user?.escolaId,
        publico: true,
        dataInicio: { gte: hoje, lte: em7Dias },
      },
      include: { turma: { select: { nome: true } } },
      orderBy: { dataInicio: 'asc' },
    })

    return res.json({
      periodo: {
        inicio: hoje.toISOString().split('T')[0],
        fim: em7Dias.toISOString().split('T')[0],
      },
      totalEventos: eventos.length,
      eventos,
    })
  },

  async calendarioMes(req: Request, res: Response) {
    const { ano, mes } = req.params

    const dataInicio = new Date(Number(ano), Number(mes) - 1, 1)
    const dataFim = new Date(Number(ano), Number(mes), 0, 23, 59, 59)

    const eventos = await prisma.evento.findMany({
      where: {
        escolaId: req.user?.escolaId,
        dataInicio: { gte: dataInicio, lte: dataFim },
      },
      include: { turma: { select: { nome: true } } },
      orderBy: { dataInicio: 'asc' },
    })

    const porDia: any = {}
    eventos.forEach(e => {
      const dia = e.dataInicio.getDate()
      if (!porDia[dia]) porDia[dia] = []
      porDia[dia].push(e)
    })

    return res.json({
      ano: Number(ano),
      mes: Number(mes),
      totalEventos: eventos.length,
      porDia: Object.keys(porDia)
        .sort((a, b) => Number(a) - Number(b))
        .map(dia => ({ dia: Number(dia), eventos: porDia[dia] })),
    })
  },
}