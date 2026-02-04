import { Request, Response } from 'express'
import { prisma } from '../config/prisma'

export const lancamentoController = {
    // Criar novo lançamento (Entrada ou Saída Avulsa)
    async create(req: Request, res: Response) {
        const {
            descricao, tipo, categoria, valor,
            dataVencimento, alunoId, funcionarioId
        } = req.body

        const escolaId = req.user?.escolaId

        if (!escolaId) {
            return res.status(401).json({ error: 'Escola não identificada no token.' })
        }

        const lancamento = await prisma.lancamento.create({
            data: {
                descricao,
                tipo, // 'ENTRADA' ou 'SAIDA'
                categoria,
                valor,
                dataVencimento: new Date(dataVencimento),
                escolaId,
                alunoId: alunoId || null,
                funcionarioId: funcionarioId || null,
                status: 'PENDENTE'
            }
        })

        return res.status(201).json(lancamento)
    },

    // Listar lançamentos com filtros
    async list(req: Request, res: Response) {
        const { tipo, status, mes, ano } = req.query
        const escolaId = req.user?.escolaId

        let where: any = { escolaId, deletedAt: null }

        if (tipo) where.tipo = tipo as any
        if (status) where.status = status as any

        if (mes && ano) {
            const inicioMes = new Date(Number(ano), Number(mes) - 1, 1)
            const fimMes = new Date(Number(ano), Number(mes), 0)
            where.dataVencimento = { gte: inicioMes, lte: fimMes }
        }

        const lancamentos = await prisma.lancamento.findMany({
            where,
            include: {
                aluno: { select: { nome: true } },
                funcionario: { select: { nome: true } }
            },
            orderBy: { dataVencimento: 'asc' }
        })

        return res.json(lancamentos)
    },

    // Liquidar um lançamento (Marcar como PAGO/RECEBIDO e gerar Transação Real)
    async liquidar(req: Request, res: Response) {
        const id = req.params.id as string;
        const { dataPagamento, formaPagamento } = req.body

        const lancamento = await prisma.lancamento.findUnique({
            where: { id }
        })

        if (!lancamento) return res.status(404).json({ error: 'Lançamento não encontrado' })

        // Usamos uma transação do Prisma para garantir que ou faz tudo ou nada
        const resultado = await prisma.$transaction(async (tx) => {
            // 1. Atualiza o lançamento
            const atualizado = await tx.lancamento.update({
                where: { id },
                data: {
                    status: 'PAGO',
                    dataLiquidacao: new Date(dataPagamento || new Date())
                }
            })

            // 2. Cria a Transação Real (que aparece no extrato/auditoria)
            await tx.transacao.create({
                data: {
                    escolaId: lancamento.escolaId,
                    tipo: lancamento.tipo,
                    valor: lancamento.valor,
                    motivo: lancamento.descricao,
                    data: new Date(dataPagamento || new Date()),
                    formaPagamento: formaPagamento || 'DINHEIRO'
                }
            })

            return atualizado
        })

        return res.json(resultado)
    }
}