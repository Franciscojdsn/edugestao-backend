"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disciplinaController = void 0;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middlewares/errorHandler");
const prismaHelpers_1 = require("../utils/prismaHelpers");
/**
 * CONTROLLER: Disciplinas
 *
 * Gerencia todas as operações CRUD de disciplinas.
 * Cada método corresponde a um endpoint HTTP.
 */
exports.disciplinaController = {
    /**
     * GET /disciplinas
     *
     * Lista todas as disciplinas da escola com paginação e filtros.
     *
     * Query params:
     * - page: Número da página (padrão: 1)
     * - limit: Itens por página (padrão: 20)
     * - busca: Filtro por nome (case-insensitive)
     *
     * Retorna:
     * - data: Array de disciplinas
     * - meta: { total, page, limit, totalPages }
     */
    async list(req, res) {
        const { page = 1, limit = 20, busca } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        // Construir filtros
        let where = {};
        // Filtro de busca por nome
        if (busca) {
            where.nome = {
                contains: busca,
                mode: 'insensitive', // Busca case-insensitive
            };
        }
        // Aplicar multi-tenancy (apenas disciplinas da escola)
        where = (0, prismaHelpers_1.withEscolaId)(where);
        // Buscar disciplinas + contagem total
        const [disciplinas, total] = await Promise.all([
            prisma_1.prisma.disciplina.findMany({
                where,
                skip,
                take: Number(limit),
                select: {
                    id: true,
                    nome: true,
                    cargaHoraria: true,
                    createdAt: true,
                    _count: {
                        select: {
                            turmas: true, // Quantas turmas têm essa disciplina
                            notas: true, // Quantas notas foram lançadas
                        },
                    },
                },
                orderBy: {
                    nome: 'asc', // Ordem alfabética
                },
            }),
            prisma_1.prisma.disciplina.count({ where }),
        ]);
        return res.json({
            data: disciplinas,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    },
    /**
     * GET /disciplinas/:id
     *
     * Busca uma disciplina específica por ID.
     *
     * Params:
     * - id: UUID da disciplina
     *
     * Retorna:
     * - Dados completos da disciplina
     * - Turmas que têm essa disciplina
     * - Contadores de relacionamentos
     *
     * Erro 404 se não encontrar
     */
    async show(req, res) {
        const { id } = req.params;
        const idFormatado = Array.isArray(id) ? id[0] : id;
        const disciplina = await prisma_1.prisma.disciplina.findFirst({
            where: (0, prismaHelpers_1.withEscolaId)({ id: idFormatado }),
            include: {
                turmas: {
                    select: {
                        turma: {
                            select: {
                                id: true,
                                nome: true,
                                anoLetivo: true,
                                turno: true,
                            },
                        },
                    },
                    orderBy: {
                        turma: {
                            nome: 'asc',
                        },
                    },
                },
                _count: {
                    select: {
                        turmas: true,
                        notas: true,
                    },
                },
            },
        });
        if (!disciplina) {
            throw new errorHandler_1.AppError('Disciplina não encontrada', 404);
        }
        return res.json(disciplina);
    },
    /**
     * POST /disciplinas
     *
     * Cria uma nova disciplina.
     *
     * Body:
     * - nome: string (obrigatório)
     * - cargaHoraria: number (obrigatório)
     *
     * Validações:
     * - Nome único por escola
     * - Carga horária entre 1-200h
     *
     * Retorna:
     * - Disciplina criada (status 201)
     */
    async create(req, res) {
        const dados = req.body;
        const escolaId = req.user?.escolaId;
        if (!escolaId) {
            throw new errorHandler_1.AppError('Escola não identificada', 400);
        }
        // Verificar se disciplina com mesmo nome já existe
        const disciplinaExiste = await prisma_1.prisma.disciplina.findFirst({
            where: (0, prismaHelpers_1.withEscolaId)({
                nome: dados.nome,
            }),
        });
        if (disciplinaExiste) {
            throw new errorHandler_1.AppError('Já existe uma disciplina com este nome', 400);
        }
        // Criar disciplina
        const disciplina = await prisma_1.prisma.disciplina.create({
            data: {
                ...dados,
                escolaId,
            },
        });
        return res.status(201).json(disciplina);
    },
    /**
     * PUT /disciplinas/:id
     *
     * Atualiza uma disciplina existente.
     *
     * Params:
     * - id: UUID da disciplina
     *
     * Body:
     * - nome: string (opcional)
     * - cargaHoraria: number (opcional)
     *
     * Validações:
     * - Disciplina deve existir e pertencer à escola
     * - Nome não pode duplicar com outra disciplina
     *
     * Retorna:
     * - Disciplina atualizada
     */
    async update(req, res) {
        const { id } = req.params;
        const dados = req.body;
        const idFormatado = Array.isArray(id) ? id[0] : id;
        // Verificar se disciplina existe e pertence à escola
        const disciplinaExistente = await prisma_1.prisma.disciplina.findFirst({
            where: (0, prismaHelpers_1.withEscolaId)({ id: idFormatado }),
        });
        if (!disciplinaExistente) {
            throw new errorHandler_1.AppError('Disciplina não encontrada', 404);
        }
        // Se está alterando nome, verificar duplicação
        if (dados.nome && dados.nome !== disciplinaExistente.nome) {
            const nomeEmUso = await prisma_1.prisma.disciplina.findFirst({
                where: (0, prismaHelpers_1.withEscolaId)({
                    nome: dados.nome,
                    id: { not: idFormatado },
                }),
            });
            if (nomeEmUso) {
                throw new errorHandler_1.AppError('Já existe uma disciplina com este nome', 400);
            }
        }
        // Atualizar
        const disciplina = await prisma_1.prisma.disciplina.update({
            where: { id: idFormatado },
            data: dados,
        });
        return res.json(disciplina);
    },
    /**
     * DELETE /disciplinas/:id
     *
     * Deleta uma disciplina.
     *
     * IMPORTANTE: Disciplina NÃO tem soft delete.
     * É hard delete (DELETE físico).
     *
     * Proteção:
     * - Não permite deletar se tiver notas lançadas
     * - Permite deletar mesmo se vinculada a turmas (vínculos são removidos)
     *
     * Retorna:
     * - 204 No Content (sem body)
     */
    async delete(req, res) {
        const { id } = req.params;
        const idFormatado = Array.isArray(id) ? id[0] : id;
        // Verificar se disciplina existe e pertence à escola
        const disciplina = await prisma_1.prisma.disciplina.findFirst({
            where: (0, prismaHelpers_1.withEscolaId)({ id: idFormatado }),
            include: {
                _count: {
                    select: {
                        notas: true,
                    },
                },
            },
        });
        if (!disciplina) {
            throw new errorHandler_1.AppError('Disciplina não encontrada', 404);
        }
        // Não permitir deletar se tiver notas lançadas
        if (disciplina._count.notas > 0) {
            throw new errorHandler_1.AppError(`Não é possível deletar disciplina com ${disciplina._count.notas} nota(s) lançada(s)`, 400);
        }
        // Deletar disciplina
        // Nota: Vínculos com turmas são removidos automaticamente (CASCADE)
        await prisma_1.prisma.disciplina.delete({
            where: { id: idFormatado },
        });
        return res.status(204).send();
    },
};
//# sourceMappingURL=disciplinaController.js.map