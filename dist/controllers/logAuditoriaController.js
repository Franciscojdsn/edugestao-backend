"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditoriaController = void 0;
const prisma_1 = require("../config/prisma");
// logAuditoriaController.ts (Trecho atualizado)
exports.logAuditoriaController = {
    async list(req, res) {
        const { page = 1, limit = 10, entidade, acao } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        let where = { escolaId: req.user?.escolaId };
        if (entidade)
            where.entidade = entidade;
        if (acao)
            where.acao = acao;
        const [logs, total] = await Promise.all([
            prisma_1.prisma.logAuditoria.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.logAuditoria.count({ where }),
        ]);
        return res.json({
            data: logs,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)), // Essencial para o front
            },
        });
    },
    async show(req, res) {
        const { id } = req.params;
        const idFormatado = Array.isArray(id) ? id[0] : id;
        const log = await prisma_1.prisma.logAuditoria.findFirst({
            where: { id: idFormatado, escolaId: req.user?.escolaId },
        });
        if (!log)
            return res.status(404).json({ message: 'Log não encontrado' });
        // Se precisar buscar o nome do funcionário manualmente para o detalhe:
        let nomeUsuario = 'Sistema/Outro';
        if (log.usuarioId) {
            const func = await prisma_1.prisma.funcionario.findUnique({
                where: { id: log.usuarioId },
                select: { nome: true }
            });
            if (func)
                nomeUsuario = func.nome;
        }
        return res.json({ ...log, nomeUsuario });
    },
    async exportar(req, res) {
        const { entidade, dataInicio, dataFim } = req.query;
        let where = { escolaId: req.user?.escolaId };
        if (entidade)
            where.entidade = entidade;
        if (dataInicio || dataFim) {
            where.createdAt = {};
            if (dataInicio)
                where.createdAt.gte = new Date(dataInicio);
            if (dataFim)
                where.createdAt.lte = new Date(dataFim);
        }
        const logs = await prisma_1.prisma.logAuditoria.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
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
        ].join('\n');
        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.header('Content-Disposition', 'attachment; filename=logs-auditoria.csv');
        return res.send(csv);
    },
    async estatisticas(req, res) {
        const escolaId = req.user?.escolaId;
        const { dataInicio, dataFim } = req.query;
        let where = { escolaId };
        if (dataInicio || dataFim) {
            where.createdAt = {};
            if (dataInicio)
                where.createdAt.gte = new Date(dataInicio);
            if (dataFim)
                where.createdAt.lte = new Date(dataFim);
        }
        const [total, porEntidade, porAcao] = await Promise.all([
            prisma_1.prisma.logAuditoria.count({ where }),
            prisma_1.prisma.logAuditoria.groupBy({ by: ['entidade'], where, _count: true }),
            prisma_1.prisma.logAuditoria.groupBy({ by: ['acao'], where, _count: true }),
        ]);
        return res.json({
            total,
            porEntidade: porEntidade.map(e => ({ entidade: e.entidade, quantidade: e._count })),
            porAcao: porAcao.map(a => ({ acao: a.acao, quantidade: a._count })),
        });
    },
};
//# sourceMappingURL=logAuditoriaController.js.map