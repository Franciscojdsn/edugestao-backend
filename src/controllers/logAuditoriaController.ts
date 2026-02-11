import { Request, Response } from 'express'
import { prisma } from '../config/prisma'

export const logAuditoriaController = {
  async list(req: Request, res: Response) {
    const { page = 1, limit = 50, entidade, acao, usuarioId, dataInicio, dataFim } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    let where: any = { escolaId: req.user?.escolaId }
    if (entidade) where.entidade = entidade
    if (acao) where.acao = acao
    if (usuarioId) where.usuarioId = usuarioId

    if (dataInicio || dataFim) {
      where.createdAt = {}
      if (dataInicio) where.createdAt.gte = new Date(dataInicio as string)
      if (dataFim) where.createdAt.lte = new Date(dataFim as string)
    }

    // REMOVIDO: include: { usuario: true } pois a relação não existe mais no schema
    const [logs, total] = await Promise.all([
      prisma.logAuditoria.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.logAuditoria.count({ where }),
    ])

    return res.json({
      data: logs,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    })
  },

  async show(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const log = await prisma.logAuditoria.findFirst({
      where: { id: idFormatado, escolaId: req.user?.escolaId },
    })

    if (!log) return res.status(404).json({ message: 'Log não encontrado' })

    // Se precisar buscar o nome do funcionário manualmente para o detalhe:
    let nomeUsuario = 'Sistema/Outro';
    if (log.usuarioId) {
      const func = await prisma.funcionario.findUnique({
        where: { id: log.usuarioId },
        select: { nome: true }
      });
      if (func) nomeUsuario = func.nome;
    }

    return res.json({ ...log, nomeUsuario })
  },

  async exportar(req: Request, res: Response) {
    const { entidade, dataInicio, dataFim } = req.query

    let where: any = { escolaId: req.user?.escolaId }
    if (entidade) where.entidade = entidade
    if (dataInicio || dataFim) {
      where.createdAt = {}
      if (dataInicio) where.createdAt.gte = new Date(dataInicio as string)
      if (dataFim) where.createdAt.lte = new Date(dataFim as string)
    }

    const logs = await prisma.logAuditoria.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const csv = [
      'Data,Entidade,ID Entidade,Ação,Usuário ID,IP',
      ...logs.map(l => [
        l.createdAt.toISOString(),
        l.entidade,
        l.entidadeId,
        l.acao,
        l.usuarioId || 'SISTEMA', // Usamos o ID direto aqui
        l.ip || '',
      ].join(',')),
    ].join('\n')

    res.header('Content-Type', 'text/csv; charset=utf-8')
    res.header('Content-Disposition', 'attachment; filename=logs-auditoria.csv')
    return res.send(csv)
  },

  async estatisticas(req: Request, res: Response) {
    const escolaId = req.user?.escolaId
    const { dataInicio, dataFim } = req.query

    let where: any = { escolaId }
    if (dataInicio || dataFim) {
      where.createdAt = {}
      if (dataInicio) where.createdAt.gte = new Date(dataInicio as string)
      if (dataFim) where.createdAt.lte = new Date(dataFim as string)
    }

    const [total, porEntidade, porAcao] = await Promise.all([
      prisma.logAuditoria.count({ where }),
      prisma.logAuditoria.groupBy({ by: ['entidade'], where, _count: true }),
      prisma.logAuditoria.groupBy({ by: ['acao'], where, _count: true }),
    ])

    return res.json({
      total,
      porEntidade: porEntidade.map(e => ({ entidade: e.entidade, quantidade: e._count })),
      porAcao: porAcao.map(a => ({ acao: a.acao, quantidade: a._count })),
    })
  },
}