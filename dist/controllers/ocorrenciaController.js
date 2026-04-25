"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ocorrenciaController = void 0;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middlewares/errorHandler");
const prismaHelpers_1 = require("../utils/prismaHelpers");
exports.ocorrenciaController = {
    async create(req, res) {
        const dados = req.body;
        const escolaId = req.user?.escolaId;
        const [aluno, funcionario] = await Promise.all([
            prisma_1.prisma.aluno.findFirst({ where: (0, prismaHelpers_1.withTenancy)({ id: dados.alunoId }) }),
            prisma_1.prisma.funcionario.findFirst({ where: (0, prismaHelpers_1.withEscolaId)({ id: dados.funcionarioId }) })
        ]);
        if (!aluno || !funcionario)
            throw new errorHandler_1.AppError('Aluno ou Funcionário não encontrado', 404);
        // Alteração: Criação da ocorrência dentro de uma transação
        const ocorrencia = await prisma_1.prisma.$transaction(async (tx) => {
            const novo = await tx.ocorrencia.create({
                data: {
                    ...dados,
                    data: dados.data ? new Date(dados.data) : new Date(),
                    escolaId: escolaId,
                }
            });
            // Novo: Gatilho de Notificação Automática para ocorrências GRAVES
            if (dados.gravidade === 'GRAVE' || dados.gravidade === 'GRAVISSIMA') {
                await tx.comunicado.create({
                    data: {
                        titulo: `Ocorrência Disciplinar: ${dados.titulo}`,
                        mensagem: `Prezados, informamos um registro de ocorrência grave para o aluno ${aluno.nome}. Por favor, compareçam à escola.`,
                        tipo: 'PEDAGOGICO',
                        prioridade: 'URGENTE',
                        alunoId: aluno.id,
                        escolaId: escolaId
                    }
                });
            }
            return novo;
        });
        return res.status(201).json(ocorrencia);
    },
    async estatisticas(req, res) {
        const escolaId = req.user?.escolaId;
        const { dataInicio, dataFim } = req.query;
        // Filtro de data opcional
        const filtroData = {};
        if (dataInicio || dataFim) {
            filtroData.data = {};
            if (dataInicio)
                filtroData.data.gte = new Date(dataInicio);
            if (dataFim)
                filtroData.data.lte = new Date(dataFim);
        }
        const [porGravidade, porTipo, totalRecentes] = await Promise.all([
            // Agrupado por Gravidade
            prisma_1.prisma.ocorrencia.groupBy({
                by: ['gravidade'],
                where: { escolaId, ...filtroData },
                _count: true,
            }),
            // Agrupado por Tipo
            prisma_1.prisma.ocorrencia.groupBy({
                by: ['tipo'],
                where: { escolaId, ...filtroData },
                _count: true,
            }),
            // Total Geral
            prisma_1.prisma.ocorrencia.count({
                where: { escolaId, ...filtroData }
            })
        ]);
        return res.json({
            total: totalRecentes,
            gravidade: porGravidade.map(g => ({ label: g.gravidade, qtd: g._count })),
            tipos: porTipo.map(t => ({ label: t.tipo, qtd: t._count }))
        });
    }
};
//# sourceMappingURL=ocorrenciaController.js.map