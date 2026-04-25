"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responsavelController = void 0;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middlewares/errorHandler");
const prismaHelpers_1 = require("../utils/prismaHelpers");
/**
 * CONTROLLER: Responsáveis
 *
 * Gerencia operações de responsáveis de alunos.
 */
exports.responsavelController = {
    /**
     * GET /alunos/:alunoId/responsaveis
     *
     * Lista todos os responsáveis de um aluno específico.
     *
     * Params:
     * - alunoId: UUID do aluno
     *
     * Retorna:
     * - aluno: Dados básicos do aluno
     * - responsaveis: Array de responsáveis
     * - total: Quantidade total
     */
    async listarPorAluno(req, res) {
        const { alunoId } = req.params;
        const idFormatado = Array.isArray(alunoId) ? alunoId[0] : alunoId;
        // Verificar se aluno existe e pertence à escola
        const aluno = await prisma_1.prisma.aluno.findFirst({
            where: (0, prismaHelpers_1.withEscolaId)({
                id: idFormatado,
                deletedAt: null, // Aluno não deletado
            }),
            select: {
                id: true,
                nome: true,
                numeroMatricula: true,
            },
        });
        if (!aluno) {
            throw new errorHandler_1.AppError('Aluno não encontrado', 404);
        }
        // Buscar responsáveis
        const responsaveis = await prisma_1.prisma.responsavel.findMany({
            where: { alunoId: idFormatado },
            include: {
                endereco: true,
            },
            orderBy: [
                { isResponsavelFinanceiro: 'desc' }, // Financeiro primeiro
                { nome: 'asc' },
            ],
        });
        return res.json({
            aluno,
            responsaveis,
            total: responsaveis.length,
        });
    },
    /**
     * GET /responsaveis
     *
     * Lista TODOS os responsáveis da escola (admin).
     * Com filtros e paginação.
     *
     * Query params:
     * - page, limit
     * - busca: Nome ou CPF
     * - tipo: PAI, MAE, etc
     * - isResponsavelFinanceiro: true/false
     */
    async list(req, res) {
        const { page = 1, limit = 20, busca, tipo, isResponsavelFinanceiro, } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        // Construir filtros
        let where = {};
        if (tipo)
            where.tipo = tipo;
        if (isResponsavelFinanceiro !== undefined) {
            where.isResponsavelFinanceiro = isResponsavelFinanceiro === 'true';
        }
        // Busca por nome ou CPF
        if (busca) {
            where.OR = [
                { nome: { contains: busca, mode: 'insensitive' } },
                { cpf: { contains: busca, mode: 'insensitive' } },
            ];
        }
        // Multi-tenancy via aluno
        where.aluno = {
            escolaId: req.user?.escolaId,
            deletedAt: null,
        };
        // Buscar responsáveis
        const [responsaveis, total] = await Promise.all([
            prisma_1.prisma.responsavel.findMany({
                where,
                skip,
                take: Number(limit),
                select: {
                    id: true,
                    nome: true,
                    tipo: true,
                    cpf: true,
                    email: true,
                    isResponsavelFinanceiro: true,
                    aluno: {
                        select: {
                            id: true,
                            nome: true,
                            numeroMatricula: true,
                        },
                    },
                },
                orderBy: {
                    nome: 'asc',
                },
            }),
            prisma_1.prisma.responsavel.count({ where }),
        ]);
        return res.json({
            data: responsaveis,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    },
    /**
     * GET /responsaveis/:id
     *
     * Busca um responsável específico por ID.
     *
     * Retorna dados completos incluindo:
     * - Endereço
     * - Aluno vinculado
     * - Contratos (se for responsável financeiro)
     */
    async show(req, res) {
        const { id } = req.params;
        const idFormatado = Array.isArray(id) ? id[0] : id;
        const responsavel = await prisma_1.prisma.responsavel.findFirst({
            where: {
                id: idFormatado,
                aluno: {
                    escolaId: req.user?.escolaId,
                    deletedAt: null,
                },
            },
            include: {
                aluno: {
                    select: {
                        id: true,
                        nome: true,
                        numeroMatricula: true,
                        turma: {
                            select: {
                                id: true,
                                nome: true,
                            },
                        },
                    },
                },
                endereco: true,
                contratos: {
                    select: {
                        id: true,
                        diaVencimento: true,
                        dataInicio: true,
                        dataFim: true,
                    },
                },
            },
        });
        if (!responsavel) {
            throw new errorHandler_1.AppError('Responsável não encontrado', 404);
        }
        return res.json(responsavel);
    },
    /**
     * POST /responsaveis
     *
     * Cria um novo responsável vinculado a um aluno.
     *
     * Body:
     * - alunoId: UUID (obrigatório)
     * - nome, tipo, telefone: obrigatórios
     * - cpf, email: opcionais
     * - isResponsavelFinanceiro: boolean (default: false)
     *
     * Validações:
     * - Aluno deve existir e pertencer à escola
     * - Se isResponsavelFinanceiro=true, remove flag dos outros
     */
    async create(req, res) {
        const dados = req.body;
        const escolaId = req.user?.escolaId;
        if (!escolaId) {
            throw new errorHandler_1.AppError('Escola não identificada', 400);
        }
        // Verificar se aluno existe e pertence à escola
        const aluno = await prisma_1.prisma.aluno.findFirst({
            where: (0, prismaHelpers_1.withEscolaId)({
                id: dados.alunoId,
                deletedAt: null,
            }),
        });
        if (!aluno) {
            throw new errorHandler_1.AppError('Aluno não encontrado', 404);
        }
        // Se está marcando como responsável financeiro
        if (dados.isResponsavelFinanceiro) {
            // Remover flag dos outros responsáveis deste aluno
            await prisma_1.prisma.responsavel.updateMany({
                where: { alunoId: dados.alunoId },
                data: { isResponsavelFinanceiro: false },
            });
        }
        // Criar responsável
        const responsavel = await prisma_1.prisma.responsavel.create({
            data: {
                ...dados,
                escolaId, // Multi-tenancy
            },
            include: {
                aluno: {
                    select: {
                        id: true,
                        nome: true,
                        numeroMatricula: true,
                    },
                },
            },
        });
        return res.status(201).json(responsavel);
    },
    /**
     * PUT /responsaveis/:id
     *
     * Atualiza um responsável existente.
     *
     * Não permite alterar o alunoId (vínculo é fixo).
     *
     * Se alterar isResponsavelFinanceiro para true,
     * remove a flag dos outros responsáveis do mesmo aluno.
     */
    async update(req, res) {
        const { id } = req.params;
        const dados = req.body;
        const idFormatado = Array.isArray(id) ? id[0] : id;
        // Verificar se responsável existe e pertence à escola
        const responsavelExistente = await prisma_1.prisma.responsavel.findFirst({
            where: {
                id: idFormatado,
                aluno: {
                    escolaId: req.user?.escolaId,
                    deletedAt: null,
                },
            },
        });
        if (!responsavelExistente) {
            throw new errorHandler_1.AppError('Responsável não encontrado', 404);
        }
        // Se está alterando para responsável financeiro
        if (dados.isResponsavelFinanceiro && !responsavelExistente.isResponsavelFinanceiro) {
            // Remover flag dos outros
            await prisma_1.prisma.responsavel.updateMany({
                where: {
                    alunoId: responsavelExistente.alunoId,
                    id: { not: idFormatado },
                },
                data: { isResponsavelFinanceiro: false },
            });
        }
        // Atualizar
        const responsavel = await prisma_1.prisma.responsavel.update({
            where: { id: idFormatado },
            data: dados,
            include: {
                aluno: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        });
        return res.json(responsavel);
    },
    /**
     * DELETE /responsaveis/:id
     *
     * Deleta um responsável.
     *
     * IMPORTANTE: Responsável NÃO tem soft delete.
     * É hard delete (DELETE físico).
     *
     * Proteção:
     * - Não permite deletar se for único responsável do aluno
     * - Não permite deletar se tiver contratos ativos
     */
    async delete(req, res) {
        const { id } = req.params;
        const idFormatado = Array.isArray(id) ? id[0] : id;
        // Verificar se responsável existe
        const responsavel = await prisma_1.prisma.responsavel.findFirst({
            where: {
                id: idFormatado,
                aluno: {
                    escolaId: req.user?.escolaId,
                    deletedAt: null,
                },
            },
            include: {
                _count: {
                    select: {
                        contratos: true,
                    },
                },
            },
        });
        if (!responsavel) {
            throw new errorHandler_1.AppError('Responsável não encontrado', 404);
        }
        // Não permitir deletar se tiver contratos
        if (responsavel._count.contratos > 0) {
            throw new errorHandler_1.AppError('Não é possível deletar responsável com contratos vinculados', 400);
        }
        // Verificar se é o único responsável do aluno
        const totalResponsaveis = await prisma_1.prisma.responsavel.count({
            where: { alunoId: responsavel.alunoId },
        });
        if (totalResponsaveis === 1) {
            throw new errorHandler_1.AppError('Não é possível deletar o único responsável do aluno', 400);
        }
        // Deletar
        await prisma_1.prisma.responsavel.delete({
            where: { id: idFormatado },
        });
        return res.status(204).send();
    },
};
//# sourceMappingURL=responsavelController.js.map