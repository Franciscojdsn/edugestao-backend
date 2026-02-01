import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withTenancy, withEscolaId } from '../utils/prismaHelpers'


export const ocorrenciaController = {
  async create(req: Request, res: Response) {
    const dados = req.body
    const escolaId = req.user?.escolaId

    const aluno = await prisma.aluno.findFirst({
      where: withTenancy({ id: dados.alunoId }),
    })
    if (!aluno) throw new AppError('Aluno não encontrado', 404)

    const funcionario = await prisma.funcionario.findFirst({
      where: withEscolaId({ id: dados.funcionarioId }),
    })
    if (!funcionario) throw new AppError('Funcionário não encontrado', 404)

    const ocorrencia = await prisma.ocorrencia.create({
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao,
        tipo: dados.tipo,
        gravidade: dados.gravidade || 'LEVE',
        data: dados.data ? new Date(dados.data) : new Date(),
        acaoTomada: dados.acaoTomada || null,
        alunoId: dados.alunoId,
        funcionarioId: dados.funcionarioId,
        escolaId: escolaId!,
      },
      include: {
        aluno: { select: { nome: true, numeroMatricula: true } },
        funcionario: { select: { nome: true } },
      },
    })

    return res.status(201).json(ocorrencia)
  },

  async list(req: Request, res: Response) {
    const { page = 1, limit = 20, tipo, gravidade, alunoId, funcionarioId, dataInicio, dataFim } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    let where: any = { escolaId: req.user?.escolaId }
    if (tipo) where.tipo = tipo
    if (gravidade) where.gravidade = gravidade
    if (alunoId) where.alunoId = alunoId
    if (funcionarioId) where.funcionarioId = funcionarioId

    if (dataInicio || dataFim) {
      where.data = {}
      if (dataInicio) where.data.gte = new Date(dataInicio as string)
      if (dataFim) where.data.lte = new Date(dataFim as string)
    }

    const [ocorrencias, total] = await Promise.all([
      prisma.ocorrencia.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          aluno: { select: { nome: true, numeroMatricula: true } },
          funcionario: { select: { nome: true } },
        },
        orderBy: [{ gravidade: 'desc' }, { data: 'desc' }],
      }),
      prisma.ocorrencia.count({ where }),
    ])

    return res.json({
      data: ocorrencias,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    })
  },

  async show(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const ocorrencia = await prisma.ocorrencia.findFirst({
      where: { id: idFormatado, escolaId: req.user?.escolaId },
      include: {
        aluno: {
          select: {
            nome: true,
            numeroMatricula: true,
            responsaveis: { select: { nome: true, telefone1: true, email: true } },
          },
        },
        funcionario: { select: { nome: true } },
      },
    })

    if (!ocorrencia) throw new AppError('Ocorrência não encontrada', 404)
    return res.json(ocorrencia)
  },

  async update(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id
    const dados = req.body

    const ocorrencia = await prisma.ocorrencia.findFirst({
      where: { id: idFormatado, escolaId: req.user?.escolaId },
    })
    if (!ocorrencia) throw new AppError('Ocorrência não encontrada', 404)

    const atualizada = await prisma.ocorrencia.update({
      where: { id: idFormatado },
      data: dados,
    })

    return res.json(atualizada)
  },

  async comunicarPais(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const ocorrencia = await prisma.ocorrencia.findFirst({
      where: { id: idFormatado, escolaId: req.user?.escolaId },
      include: { aluno: { select: { id: true, nome: true } } },
    })

    if (!ocorrencia) throw new AppError('Ocorrência não encontrada', 404)
    if (ocorrencia.paisComunicados) throw new AppError('Pais já foram comunicados', 400)

    const prioridade = (ocorrencia.gravidade === 'GRAVISSIMA' || ocorrencia.gravidade === 'GRAVE')
      ? 'URGENTE'
      : 'ALTA'

    await prisma.comunicado.create({
      data: {
        titulo: `Ocorrência Registrada: ${ocorrencia.titulo}`,
        mensagem: `Prezado responsável, foi registrada uma ocorrência com ${ocorrencia.aluno.nome}. Descrição: ${ocorrencia.descricao}. Gravidade: ${ocorrencia.gravidade}. Ação tomada: ${ocorrencia.acaoTomada || 'Em andamento'}.`,
        tipo: 'URGENTE',
        prioridade: prioridade as any,
        escolaId: req.user?.escolaId!,
        alunoId: ocorrencia.alunoId,
      },
    })

    await prisma.ocorrencia.update({
      where: { id: idFormatado },
      data: { paisComunicados: true, dataComunicacao: new Date() },
    })

    return res.json({ message: 'Pais comunicados com sucesso' })
  },

  async relatorioAluno(req: Request, res: Response) {
    const { alunoId } = req.params
    const idFormatado = Array.isArray(alunoId) ? alunoId[0] : alunoId

    const aluno = await prisma.aluno.findFirst({
      where: withTenancy({ id: idFormatado }),
      select: { nome: true, numeroMatricula: true },
    })
    if (!aluno) throw new AppError('Aluno não encontrado', 404)

    const ocorrencias = await prisma.ocorrencia.findMany({
      where: { alunoId: idFormatado },
      include: { funcionario: { select: { nome: true } } },
      orderBy: { data: 'desc' },
    })

    const porTipo: any = {}
    const porGravidade: any = {}

    ocorrencias.forEach(o => {
      porTipo[o.tipo] = (porTipo[o.tipo] || 0) + 1
      porGravidade[o.gravidade] = (porGravidade[o.gravidade] || 0) + 1
    })

    return res.json({
      aluno,
      total: ocorrencias.length,
      porTipo: Object.keys(porTipo).map(k => ({ tipo: k, quantidade: porTipo[k] })),
      porGravidade: Object.keys(porGravidade).map(k => ({ gravidade: k, quantidade: porGravidade[k] })),
      ocorrencias,
    })
  },

  async resumoEscola(req: Request, res: Response) {
    const escolaId = req.user?.escolaId
    const { dataInicio, dataFim } = req.query

    let where: any = { escolaId }
    if (dataInicio || dataFim) {
      where.data = {}
      if (dataInicio) where.data.gte = new Date(dataInicio as string)
      if (dataFim) where.data.lte = new Date(dataFim as string)
    }

    const [total, porTipo, porGravidade, naoComunicados] = await Promise.all([
      prisma.ocorrencia.count({ where }),
      prisma.ocorrencia.groupBy({ by: ['tipo'], where, _count: true }),
      prisma.ocorrencia.groupBy({ by: ['gravidade'], where, _count: true }),
      prisma.ocorrencia.count({ where: { ...where, paisComunicados: false } }),
    ])

    return res.json({
      total,
      naoComunicados,
      porTipo: porTipo.map(t => ({ tipo: t.tipo, quantidade: t._count })),
      porGravidade: porGravidade.map(g => ({ gravidade: g.gravidade, quantidade: g._count })),
    })
  },
}