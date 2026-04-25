"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronogramaProvaController = void 0;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middlewares/errorHandler");
exports.cronogramaProvaController = {
    // Criar o cronograma para uma turma específica
    async create(req, res) {
        const { turmaId, disciplinasPorDia } = req.body; // Array de { data, disciplinaId, ordem }
        const escolaId = req.user?.escolaId;
        const registros = await prisma_1.prisma.$transaction(disciplinasPorDia.map((item) => prisma_1.prisma.cronogramaProva.create({
            data: {
                data: new Date(item.data),
                ordem: item.ordem || 1,
                turmaId,
                disciplinaId: item.disciplinaId,
                escolaId: escolaId
            }
        })));
        return res.status(201).json(registros);
    },
    // Rota para o Portal do Responsável
    async portalResponsavel(req, res) {
        const turmaId = req.params.id;
        const { dataInicio, dataFim } = req.query;
        const provas = await prisma_1.prisma.cronogramaProva.findMany({
            where: {
                turmaId,
                data: {
                    gte: dataInicio ? new Date(dataInicio) : undefined,
                    lte: dataFim ? new Date(dataFim) : undefined,
                }
            },
            include: {
                disciplina: { select: { nome: true } }
            },
            orderBy: [
                { data: 'asc' },
                { ordem: 'asc' }
            ]
        });
        return res.json(provas);
    },
    // Rota para copiar cronograma de uma turma para outras turmas
    async copiar(req, res) {
        const { turmaOrigemId, turmasDestinoIds, dataInicio, dataFim } = req.body;
        const escolaId = req.user?.escolaId;
        if (!turmasDestinoIds || !Array.isArray(turmasDestinoIds)) {
            throw new errorHandler_1.AppError('Selecione ao menos uma turma de destino.', 400);
        }
        // 1. Buscar as provas da turma de origem no período selecionado
        const provasOrigem = await prisma_1.prisma.cronogramaProva.findMany({
            where: {
                turmaId: turmaOrigemId,
                escolaId,
                data: {
                    gte: new Date(dataInicio),
                    lte: new Date(dataFim)
                }
            }
        });
        if (provasOrigem.length === 0) {
            throw new errorHandler_1.AppError('Nenhum cronograma encontrado na turma de origem para este período.', 404);
        }
        // 2. Executar a cópia em massa via Transação
        const resultado = await prisma_1.prisma.$transaction(async (tx) => {
            const criacoes = [];
            for (const turmaDestinoId of turmasDestinoIds) {
                // Opcional: Limpar cronogramas existentes na turma de destino para evitar duplicidade
                await tx.cronogramaProva.deleteMany({
                    where: {
                        turmaId: turmaDestinoId,
                        escolaId,
                        data: { gte: new Date(dataInicio), lte: new Date(dataFim) }
                    }
                });
                // Preparar os novos registros baseados na origem
                for (const prova of provasOrigem) {
                    criacoes.push(tx.cronogramaProva.create({
                        data: {
                            data: prova.data,
                            ordem: prova.ordem,
                            disciplinaId: prova.disciplinaId,
                            turmaId: turmaDestinoId,
                            escolaId: escolaId
                        }
                    }));
                }
            }
            return Promise.all(criacoes);
        });
        return res.status(201).json({
            mensagem: `Cronograma replicado com sucesso para ${turmasDestinoIds.length} turmas.`,
            totalRegistros: resultado.length
        });
    }
};
//# sourceMappingURL=cronogramaProvaController.js.map