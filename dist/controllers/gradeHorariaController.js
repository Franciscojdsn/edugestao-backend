"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradeHorariaController = void 0;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middlewares/errorHandler");
exports.gradeHorariaController = {
    // 1. Cadastrar um horário na grade
    async create(req, res) {
        const { diaSemana, horarioInicio, horarioFim, turmaDisciplinaId } = req.body;
        const escolaId = req.user?.escolaId;
        // 1. Buscamos o vínculo para descobrir qual é a Turma (e validar o professor)
        const vinculo = await prisma_1.prisma.turmaDisciplina.findUnique({
            where: { id: turmaDisciplinaId },
            select: { professorId: true, turmaId: true } // Alteração: Pegando o turmaId aqui
        });
        if (!vinculo)
            throw new errorHandler_1.AppError('Vínculo de disciplina não encontrado', 404);
        // 2. Validação de choque de horário (Professor não pode estar em dois lugares)
        const choque = await prisma_1.prisma.gradeHoraria.findFirst({
            where: {
                escolaId,
                diaSemana: Number(diaSemana),
                horarioInicio,
                turmaDisciplina: { professorId: vinculo.professorId }
            }
        });
        if (choque)
            throw new errorHandler_1.AppError('Este professor já tem uma aula neste horário', 400);
        // 3. Criação da Grade (Correção do erro TS)
        const grade = await prisma_1.prisma.gradeHoraria.create({
            data: {
                diaSemana: Number(diaSemana),
                horarioInicio,
                horarioFim,
                escola: { connect: { id: escolaId } },
                turmaDisciplina: { connect: { id: turmaDisciplinaId } },
                // SOLUÇÃO: Adicionando a conexão com a Turma que o Schema agora exige
                turma: { connect: { id: vinculo.turmaId } } // Novo
            }
        });
        return res.status(201).json(grade);
    },
    // 2. Visão dos Pais: "O que tem na mochila hoje?" (Novo)
    async agendaDoDia(req, res) {
        const { alunoId } = req.params.id;
        const hoje = new Date().getDay(); // 0 (Dom) a 6 (Sáb)
        const aluno = await prisma_1.prisma.aluno.findUnique({
            where: { id: alunoId },
            select: { turmaId: true }
        });
        if (!aluno || !aluno.turmaId) {
            throw new errorHandler_1.AppError('Aluno não encontrado ou não matriculado em uma turma', 404);
        }
        const agenda = await prisma_1.prisma.gradeHoraria.findMany({
            where: {
                diaSemana: hoje,
                turmaId: aluno.turmaId,
                escolaId: req.user?.escolaId
            },
            include: {
                turmaDisciplina: {
                    include: {
                        disciplina: { select: { nome: true, descricao: true } },
                        professor: { select: { nome: true } }
                    }
                }
            },
            orderBy: { horarioInicio: 'asc' }
        });
        return res.json(agenda);
    },
    async aulaAtual(req, res) {
        const funcionarioId = req.user?.userId; // ID do professor logado
        const escolaId = req.user?.escolaId;
        const agora = new Date();
        const diaSemana = agora.getDay(); // 1-5 (Seg-Sex)
        // Formata hora atual para "HH:mm" para comparar com a string do banco
        const horaAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        // Busca na Grade se existe uma aula para este professor neste momento
        const aula = await prisma_1.prisma.gradeHoraria.findFirst({
            where: {
                escolaId,
                diaSemana,
                horarioInicio: { lte: horaAtual },
                horarioFim: { gte: horaAtual },
                turmaDisciplina: { professorId: funcionarioId }
            },
            include: {
                turma: { select: { id: true, nome: true } },
                turmaDisciplina: {
                    include: { disciplina: { select: { id: true, nome: true } } }
                }
            }
        });
        if (!aula) {
            return res.status(404).json({ message: "Nenhuma aula agendada para este horário." });
        }
        // Retorna os dados prontos para o frontend montar a lista de chamada
        return res.json({
            turmaId: aula.turmaId,
            turmaNome: aula.turma.nome,
            disciplinaId: aula.turmaDisciplina.disciplinaId,
            disciplinaNome: aula.turmaDisciplina.disciplina.nome
        });
    },
    async listarPorTurma(req, res) {
        const turmaId = req.params.id;
        const escolaId = req.user?.escolaId;
        const grade = await prisma_1.prisma.gradeHoraria.findMany({
            where: {
                turmaId,
                escolaId,
            },
            include: {
                turmaDisciplina: {
                    include: {
                        disciplina: { select: { nome: true } },
                        professor: { select: { nome: true } }
                    }
                }
            },
            // Ordena por dia da semana (0-6) e depois pelo horário
            orderBy: [
                { diaSemana: 'asc' },
                { horarioInicio: 'asc' }
            ]
        });
        return res.json(grade);
    },
    async agendaProfessor(req, res) {
        const professorId = req.user?.userId; // ID vindo do token
        const escolaId = req.user?.escolaId;
        const agenda = await prisma_1.prisma.gradeHoraria.findMany({
            where: {
                escolaId,
                turmaDisciplina: {
                    professorId: professorId
                }
            },
            include: {
                turma: { select: { nome: true } },
                turmaDisciplina: {
                    include: {
                        disciplina: { select: { nome: true } }
                    }
                }
            },
            orderBy: [
                { diaSemana: 'asc' },
                { horarioInicio: 'asc' }
            ]
        });
        return res.json(agenda);
    },
};
//# sourceMappingURL=gradeHorariaController.js.map