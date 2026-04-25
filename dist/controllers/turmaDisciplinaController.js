"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.turmaDisciplinaController = void 0;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middlewares/errorHandler");
const prismaHelpers_1 = require("../utils/prismaHelpers");
exports.turmaDisciplinaController = {
    /**
     * POST /turmas/:turmaId/disciplinas
     * Vincula uma disciplina à turma e define qual professor a lecionará ali.
     */
    async vincular(req, res) {
        const turmaId = req.params.turmaId;
        const { disciplinaId, professorId } = req.body;
        // 1. Validar se a Turma pertence à escola usando o helper
        const turma = await prisma_1.prisma.turma.findFirst({
            where: (0, prismaHelpers_1.withEscolaId)({ id: turmaId }),
        });
        if (!turma)
            throw new errorHandler_1.AppError('Turma não encontrada', 404);
        // 2. Validar Disciplina
        const disciplina = await prisma_1.prisma.disciplina.findFirst({
            where: (0, prismaHelpers_1.withEscolaId)({ id: disciplinaId }),
        });
        if (!disciplina)
            throw new errorHandler_1.AppError('Disciplina não encontrada', 404);
        // 3. Validar Professor
        const professor = await prisma_1.prisma.funcionario.findFirst({
            where: (0, prismaHelpers_1.withEscolaId)({ id: professorId }),
        });
        if (!professor)
            throw new errorHandler_1.AppError('Professor não encontrado nesta escola', 404);
        // 4. Criar ou atualizar o vínculo
        const vinculo = await prisma_1.prisma.turmaDisciplina.upsert({
            where: {
                turmaId_disciplinaId: { turmaId, disciplinaId },
            },
            update: { professorId },
            create: {
                turmaId,
                disciplinaId,
                professorId
            },
            include: {
                disciplina: { select: { nome: true } },
                professor: { select: { nome: true } }
            }
        });
        return res.status(201).json(vinculo);
    },
    async listarDisciplinasDaTurma(req, res) {
        const turmaId = req.params.turmaId;
        const disciplinas = await prisma_1.prisma.turmaDisciplina.findMany({
            where: {
                turmaId,
                turma: (0, prismaHelpers_1.withEscolaId)({}), // Garante que a turma pai pertence à escola
            },
            include: {
                disciplina: { select: { id: true, nome: true, cargaHoraria: true } },
                professor: { select: { id: true, nome: true } }
            },
            orderBy: { disciplina: { nome: 'asc' } }
        });
        return res.json(disciplinas);
    },
    async desvincular(req, res) {
        // Use o "as string" para garantir o tipo único
        const turmaId = req.params.turmaId;
        const disciplinaId = req.params.disciplinaId;
        const escolaId = req.user?.escolaId;
        const vinculo = await prisma_1.prisma.turmaDisciplina.findFirst({
            where: {
                turmaId,
                disciplinaId,
                turma: { escolaId }
            }
        });
        if (!vinculo)
            throw new errorHandler_1.AppError('Vínculo não encontrado', 404);
        await prisma_1.prisma.turmaDisciplina.delete({
            where: { id: vinculo.id }
        });
        return res.status(204).send();
    }
};
//# sourceMappingURL=turmaDisciplinaController.js.map