import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withEscolaId, withTenancy } from '../utils/prismaHelpers'

export const comunicadoController = {
    /**
     * POST /comunicados
     * Envia comunicado individual
     */
    async create(req: Request, res: Response) {
        const dados = req.body
        const escolaId = req.user?.escolaId

        // Validar destinatários
        if (dados.alunoId) {
            const aluno = await prisma.aluno.findFirst({
                where: withTenancy({ id: dados.alunoId }),
            })
            if (!aluno) throw new AppError('Aluno não encontrado', 404)
        }

        if (dados.turmaId) {
            const turma = await prisma.turma.findFirst({
                where: withEscolaId({ id: dados.turmaId }),
            })
            if (!turma) throw new AppError('Turma não encontrada', 404)
        }

        if (dados.responsavelId) {
            const responsavel = await prisma.responsavel.findFirst({
                where: {
                    id: dados.responsavelId,
                    aluno: { escolaId },
                },
            })
            if (!responsavel) throw new AppError('Responsável não encontrado', 404)
        }

        const comunicado = await prisma.comunicado.create({
            data: {
                ...dados,
                escolaId,
            },
            include: {
                aluno: { select: { nome: true, numeroMatricula: true } },
                turma: { select: { nome: true } },
                responsavel: { select: { nome: true } },
            },
        })

        return res.status(201).json(comunicado)
    },

    /**
     * GET /comunicados
     * Lista comunicados com filtros
     */
    async list(req: Request, res: Response) {
        const { page = 1, limit = 20, tipo, prioridade, alunoId, turmaId, lido } = req.query
        const skip = (Number(page) - 1) * Number(limit)

        let where: any = { escolaId: req.user?.escolaId }

        if (tipo) where.tipo = tipo
        if (prioridade) where.prioridade = prioridade
        if (alunoId) where.alunoId = alunoId
        if (turmaId) where.turmaId = turmaId
        if (lido !== undefined && typeof lido === 'boolean') where.lido = lido === 'true'

        const [comunicados, total] = await Promise.all([
            prisma.comunicado.findMany({
                where,
                skip,
                take: Number(limit),
                include: {
                    aluno: { select: { nome: true, numeroMatricula: true } },
                    turma: { select: { nome: true } },
                    responsavel: { select: { nome: true } },
                },
                orderBy: [
                    { prioridade: 'desc' },
                    { dataEnvio: 'desc' },
                ],
            }),
            prisma.comunicado.count({ where }),
        ])

        return res.json({
            data: comunicados,
            meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
        })
    },

    /**
     * GET /comunicados/:id
     * Busca comunicado por ID
     */
    async show(req: Request, res: Response) {
        const { id } = req.params
        const idFormatado = Array.isArray(id) ? id[0] : id

        const comunicado = await prisma.comunicado.findFirst({
            where: {
                id: idFormatado,
                escolaId: req.user?.escolaId,
            },
            include: {
                aluno: {
                    select: {
                        nome: true,
                        numeroMatricula: true,
                        responsaveis: {
                            select: {
                                nome: true,
                                telefone1: true,
                                email: true,
                            },
                        },
                    }
                },
                turma: { select: { nome: true } },
                responsavel: { select: { nome: true, telefone1: true, email: true } },
            },
        })

        if (!comunicado) throw new AppError('Comunicado não encontrado', 404)
        return res.json(comunicado)
    },

    /**
     * PUT /comunicados/:id/marcar-lido
     * Marca comunicado como lido
     */
    async marcarLido(req: Request, res: Response) {
        const { id } = req.params
        const idFormatado = Array.isArray(id) ? id[0] : id

        const comunicado = await prisma.comunicado.findFirst({
            where: {
                id: idFormatado,
                escolaId: req.user?.escolaId,
            },
        })

        if (!comunicado) throw new AppError('Comunicado não encontrado', 404)

        const atualizado = await prisma.comunicado.update({
            where: { id: idFormatado },
            data: { lido: true },
        })

        return res.json(atualizado)
    },

    /**
     * DELETE /comunicados/:id
     * Deleta comunicado
     */
    async delete(req: Request, res: Response) {
        const { id } = req.params
        const idFormatado = Array.isArray(id) ? id[0] : id

        const comunicado = await prisma.comunicado.findFirst({
            where: {
                id: idFormatado,
                escolaId: req.user?.escolaId,
            },
        })

        if (!comunicado) throw new AppError('Comunicado não encontrado', 404)

        await prisma.comunicado.delete({
            where: { id: idFormatado },
        })

        return res.status(204).send()
    },

    /**
     * POST /comunicados/enviar-massa
     * Envia comunicado para múltiplos destinatários
     */
    async enviarMassa(req: Request, res: Response) {
        const { titulo, mensagem, tipo, prioridade, destinatarios, turmaId } = req.body
        const escolaId = req.user?.escolaId

        let alunos: any[] = []

        // Determinar destinatários
        if (destinatarios === 'TODOS') {
            alunos = await prisma.aluno.findMany({
                where: withTenancy({}),
                select: { id: true },
            })
        } else if (destinatarios === 'TURMA' && turmaId) {
            const turma = await prisma.turma.findFirst({
                where: withEscolaId({ id: turmaId }),
            })
            if (!turma) throw new AppError('Turma não encontrada', 404)

            alunos = await prisma.aluno.findMany({
                where: withTenancy({ turmaId }),
                select: { id: true },
            })
        } else if (destinatarios === 'INADIMPLENTES') {
            // Buscar alunos com pagamentos vencidos
            const hoje = new Date()
            hoje.setHours(0, 0, 0, 0)

            const pagamentosVencidos = await prisma.pagamento.findMany({
                where: {
                    status: 'PENDENTE',
                    dataVencimento: { lt: hoje },
                    aluno: { escolaId, deletedAt: null },
                },
                select: { alunoId: true },
                distinct: ['alunoId'],
            })

            alunos = pagamentosVencidos.map(p => ({ id: p.alunoId }))
        }

        if (alunos.length === 0) {
            throw new AppError('Nenhum destinatário encontrado', 400)
        }

        // Criar comunicados em batch
        const comunicadosParaCriar = alunos.map(aluno => ({
            titulo,
            mensagem,
            tipo,
            prioridade,
            escolaId,
            alunoId: aluno.id,
            turmaId: destinatarios === 'TURMA' ? turmaId : null,
        }))

        const resultado = await prisma.comunicado.createMany({
            data: comunicadosParaCriar.map(c => ({ ...c, escolaId: escolaId! })),
        })

        return res.status(201).json({
            message: `Comunicado enviado para ${resultado.count} aluno(s)`,
            totalEnviados: resultado.count,
            tipo,
            prioridade,
        })
    },

    /**
     * GET /comunicados/alunos/:alunoId
     * Lista comunicados de um aluno específico
     */
    async listarPorAluno(req: Request, res: Response) {
        const { alunoId } = req.params
        const idFormatado = Array.isArray(alunoId) ? alunoId[0] : alunoId

        const aluno = await prisma.aluno.findFirst({
            where: withTenancy({ id: idFormatado }),
            select: {
                id: true,
                nome: true,
                numeroMatricula: true,
            },
        })

        if (!aluno) throw new AppError('Aluno não encontrado', 404)

        const comunicados = await prisma.comunicado.findMany({
            where: {
                alunoId: idFormatado,
            },
            orderBy: [
                { prioridade: 'desc' },
                { dataEnvio: 'desc' },
            ],
        })

        return res.json({
            aluno,
            comunicados,
            total: comunicados.length,
            naoLidos: comunicados.filter(c => !c.lido).length,
        })
    },

    /**
     * GET /comunicados/estatisticas
     * Estatísticas de comunicados
     */
    async estatisticas(req: Request, res: Response) {
        const escolaId = req.user?.escolaId

        const [total, lidos, naoLidos, porTipo, porPrioridade] = await Promise.all([
            prisma.comunicado.count({ where: { escolaId } }),
            prisma.comunicado.count({ where: { escolaId, lido: true } }),
            prisma.comunicado.count({ where: { escolaId, lido: false } }),
            prisma.comunicado.groupBy({
                by: ['tipo'],
                where: { escolaId },
                _count: true,
            }),
            prisma.comunicado.groupBy({
                by: ['prioridade'],
                where: { escolaId },
                _count: true,
            }),
        ])

        return res.json({
            total,
            lidos,
            naoLidos,
            taxaLeitura: total > 0 ? Number(((lidos / total) * 100).toFixed(2)) : 0,
            porTipo: porTipo.map(t => ({
                tipo: t.tipo,
                quantidade: t._count,
            })),
            porPrioridade: porPrioridade.map(p => ({
                prioridade: p.prioridade,
                quantidade: p._count,
            })),
        })
    },
}