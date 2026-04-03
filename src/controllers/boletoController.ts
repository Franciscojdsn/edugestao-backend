import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

export const boletoController = {
    async liquidar(req: Request, res: Response) {
        // 1. Blindagem do ID do Boleto (Garante que é String pura)
        const { id } = req.params;
        const idFormatado = Array.isArray(id) ? String(id) : String(id);

        const { formaPagamento } = req.body;

        // 2. Blindagem dos IDs do Contexto (Token)
        const escolaId = req.user?.escolaId ? String(req.user.escolaId) : '';
        const usuarioId = (req as any).user?.id ? String((req as any).user.id) : undefined;

        if (!escolaId) throw new AppError('Tenant não identificado', 403);

        const boleto = await prisma.boletos.findFirst({
            where: {
                id: idFormatado,
                escolaId: escolaId
            }
        });

        if (!boleto) throw new AppError('Boleto não encontrado', 404);
        if (boleto.status === 'PAGO') throw new AppError('Este boleto já foi liquidado.', 400);

        // TRANSAÇÃO: Liquidação + Auditoria
        const resultado = await prisma.$transaction(async (tx) => {
            // A. Atualiza o Boleto
            const boletoAtualizado = await tx.boletos.update({
                where: { id: idFormatado },
                data: {
                    status: 'PAGO',
                    dataPagamento: new Date(),
                    formaPagamento,
                    valorPago: boleto.valorTotal
                }
            });

            // B. Gera Log de Auditoria
            await tx.logAuditoria.create({
                data: {
                    entidade: 'BOLETO',
                    entidadeId: idFormatado,
                    acao: 'LIQUIDACAO_MANUAL',
                    dadosAntigos: JSON.parse(JSON.stringify(boleto)),
                    dadosNovos: JSON.parse(JSON.stringify(boletoAtualizado)),
                    usuarioId: usuarioId, // Agora é garantido ser String ou Null
                    escolaId: escolaId,
                    ip: req.ip || ''
                }
            });

            return boletoAtualizado;
        });

        return res.json({ message: "Boleto liquidado com sucesso", data: resultado });
    }
};