import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';
import { getRequiredEscolaId } from '../utils/context';

export const logAuditoriaController = {
  /**
   * GET /logs
   * Listagem ultrarrápida (sem payloads JSON pesados)
   */
  async list(req: Request, res: Response) {
    const escolaId = getRequiredEscolaId();
    const { page, limit, entidade, acao, usuarioId, dataInicio, dataFim } = req.query as any;
    const skip = (page - 1) * limit;

    // FILTRO MANUAL OBRIGATÓRIO: Este model é ignorado pela extensão
    let where: any = { escolaId };

    if (entidade) where.entidade = entidade;
    if (acao) where.acao = acao;
    if (usuarioId) where.usuarioId = usuarioId;

    if (dataInicio || dataFim) {
      where.createdAt = {};
      if (dataInicio) where.createdAt.gte = dataInicio;
      if (dataFim) {
        // Cobre o dia todo até 23:59:59
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        where.createdAt.lte = fim;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.logAuditoria.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        // PERFORMANCE: Excluímos 'dadosNovos' e 'dadosAntigos' na listagem
        select: {
          id: true,
          entidade: true,
          entidadeId: true,
          acao: true,
          usuarioId: true,
          ip: true,
          createdAt: true
        }
      }),
      prisma.logAuditoria.count({ where }),
    ]);

    return res.json({
      status: 'success',
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  },

  /**
   * GET /logs/:id
   * Busca completa (Traz os JSONs de Antes/Depois para comparar)
   */
  async show(req: Request, res: Response) {
    const { id } = req.params;
    const idFormatado = Array.isArray(id) ? id[0] : id;
    const escolaId = getRequiredEscolaId();

    const log = await prisma.logAuditoria.findFirst({
      where: { id: idFormatado, escolaId }
    });

    if (!log) throw new AppError('Log não encontrado ou não pertence a sua escola.', 404);

    return res.json({ status: 'success', data: log });
  },

  /**
   * GET /logs/estatisticas
   */
  async estatisticas(req: Request, res: Response) {
    const escolaId = getRequiredEscolaId();
    const { dataInicio, dataFim } = req.query as any;

    let where: any = { escolaId };
    if (dataInicio || dataFim) {
      where.createdAt = {};
      if (dataInicio) where.createdAt.gte = dataInicio;
      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        where.createdAt.lte = fim;
      }
    }

    // Agregações nativas no banco para altíssima performance
    const rankingEntidades = await prisma.logAuditoria.groupBy({
      by: ['entidade'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    const rankingAcoes = await prisma.logAuditoria.groupBy({
      by: ['acao'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    return res.json({
      status: 'success',
      data: {
        entidadesMaisAlteradas: rankingEntidades.map(e => ({ entidade: e.entidade, count: e._count.id })),
        acoesMaisRealizadas: rankingAcoes.map(a => ({ acao: a.acao, count: a._count.id }))
      }
    });
  },

  /**
   * GET /logs/exportar
   * Exportação segura (Teto de 5000 registros para não estourar memória)
   */
  async exportar(req: Request, res: Response) {
    const escolaId = getRequiredEscolaId();
    const { entidade, acao, dataInicio, dataFim } = req.query as any;

    let where: any = { escolaId };
    if (entidade) where.entidade = entidade;
    if (acao) where.acao = acao;
    if (dataInicio || dataFim) {
      where.createdAt = {};
      if (dataInicio) where.createdAt.gte = dataInicio;
      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        where.createdAt.lte = fim;
      }
    }

    // Proteção de Memória
    const logs = await prisma.logAuditoria.findMany({
      where,
      take: 5000,
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, entidade: true, entidadeId: true, acao: true, usuarioId: true, ip: true }
    });

    const csv = [
      'Data,Entidade,ID Entidade,Ação,Usuário ID,IP',
      ...logs.map(l => [
        l.createdAt.toISOString(),
        l.entidade,
        l.entidadeId,
        l.acao,
        l.usuarioId || 'SISTEMA',
        l.ip || 'N/A',
      ].join(',')),
    ].join('\n');

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename=logs-auditoria.csv');
    return res.send(csv);
  }
};