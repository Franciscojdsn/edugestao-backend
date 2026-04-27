import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler';

export const lancamentoController = {
    // Criar novo lançamento (Entrada ou Saída Avulsa)
    async create(req: Request, res: Response) {
        const dados = req.body;

        const lancamento = await prisma.lancamento.create({
            data: {
                ...dados,
                status: 'PENDENTE'
                // escolaId injetado automaticamente pela Prisma Extension
            }
        });

        return res.status(201).json({ status: 'success', data: lancamento });
    },

    // Listar lançamentos com filtros
    async list(req: Request, res: Response) {
        const { tipo, status, mes, ano, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};
        if (tipo) where.tipo = tipo;
        if (status) where.status = status;

        if (mes && ano) {
            const start = new Date(Number(ano), Number(mes) - 1, 1);
            const end = new Date(Number(ano), Number(mes), 0, 23, 59, 59);
            where.dataVencimento = { gte: start, lte: end };
        }

        const [lancamentos, total] = await Promise.all([
            prisma.lancamento.findMany({
                where,
                skip,
                take: Number(limit),
                include: {
                    aluno: { select: { nome: true } },
                    funcionario: { select: { nome: true } },
                    responsavel: { select: { nome: true } }
                },
                orderBy: { dataVencimento: 'asc' }
            }),
            prisma.lancamento.count({ where })
        ]);

        return res.json({
            status: 'success',
            data: lancamentos,
            meta: { total, page: Number(page) }
        });
    },

    // Liquidar um lançamento (Marcar como PAGO/RECEBIDO e gerar Transação Real)
    async liquidar(req: Request, res: Response) {
        const { id } = req.params;
        const idFormatado = Array.isArray(id) ? id[0] : id;
        const { dataPagamento, formaPagamento } = req.body;

        const lancamento = await prisma.lancamento.findFirst({ where: { id: idFormatado } });

        if (!lancamento) throw new AppError('Lançamento não encontrado', 404);
        if (lancamento.status === 'PAGO') throw new AppError('Este lançamento já foi liquidado', 400);

        const resultado = await prisma.$transaction(async (tx) => {
            // 1. Atualiza o status da dívida/recebível
            const atualizado = await tx.lancamento.update({
                where: { id: idFormatado },
                data: {
                    status: 'PAGO',
                    dataLiquidacao: dataPagamento || new Date(),
                }
            });

            // 2. Cria a Transação de Caixa (Efetiva a entrada/saída de dinheiro no dia)
            const transacao = await tx.transacao.create({
                data: {
                    escolaId: lancamento.escolaId,
                    tipo: lancamento.tipo,
                    valor: lancamento.valor,
                    motivo: `Liquidação: ${lancamento.descricao}`,
                    data: dataPagamento || new Date(),
                    formaPagamento,
                    // A Extensão também cuida do escolaId aqui
                }
            });

            return { lancamento: atualizado, transacaoId: transacao.id };
        });

        return res.json({ status: 'success', message: 'Lançamento liquidado e contabilizado no caixa.', data: resultado });
    },

    // Soft delete de lançamento
    async delete(req: Request, res: Response) {
        const id = req.params.id as string
        const escolaId = req.user?.escolaId

        if (!escolaId) {
            return res.status(401).json({ error: 'Escola não identificada no token.' })
        }

        // Busca o lançamento garantindo o tenant e que não foi excluído
        const lancamento = await prisma.lancamento.findFirst({
            where: { id, escolaId, deletedAt: null }
        })

        if (!lancamento) {
            return res.status(404).json({ error: 'Lançamento não encontrado ou acesso negado.' })
        }

        // Regra de Negócio: Lançamentos pagos não podem ser excluídos diretamente
        if (lancamento.status === 'PAGO') {
            return res.status(400).json({ error: 'Lançamentos já liquidados não podem ser excluídos. Realize um estorno.' })
        }

        await prisma.lancamento.update({
            where: { id },
            data: { deletedAt: new Date() }
        })

        return res.status(204).send()
    },

    // Estornar um lançamento pago
    async estornar(req: Request, res: Response) {
        const id = req.params.id as string
        const lancamento = await prisma.lancamento.findFirst({ where: { id } });
        if (!lancamento) throw new AppError('Lançamento não encontrado', 404);
        if (lancamento.status !== 'PAGO') throw new AppError('Apenas lançamentos pagos podem ser estornados', 400);

        const resultado = await prisma.$transaction(async (tx) => {
            // 1. Volta a conta para pendente
            const estornado = await tx.lancamento.update({
                where: { id },
                data: {
                    status: 'PENDENTE',
                    dataLiquidacao: null
                }
            });

            // 2. Lançamento inverso no caixa para zerar o saldo
            const tipoInverso = lancamento.tipo === 'ENTRADA' ? 'SAIDA' : 'ENTRADA';
            await tx.transacao.create({
                data: {
                    escolaId: lancamento.escolaId,
                    tipo: tipoInverso,
                    valor: lancamento.valor,
                    motivo: `ESTORNO de Liquidação: ${lancamento.descricao}`,
                    data: new Date(),
                    formaPagamento: 'TRANSFERENCIA' // Ou outro método de estorno
                }
            });

            return estornado;
        });

        return res.json({ status: 'success', message: 'Estorno realizado com sucesso.', data: resultado });
    }
};