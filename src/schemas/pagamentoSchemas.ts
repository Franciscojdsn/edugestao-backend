import { z } from 'zod'

export const criarPagamentoSchema = z.object({
  body: z.object({
    params: z.object({ alunoId: z.string().uuid() }),
    referencia: z.string().min(1),
    valorTotal: z.number().positive(),
    dataVencimento: z.coerce.date(),
    mesReferencia: z.number().min(1).max(12),
    anoReferencia: z.number().min(2025),
  }),
})

export const atualizarPagamentoSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']).optional(),
    dataPagamento: z.coerce.date(),
    valorPago: z.number().positive().optional(),
  }),
})

export const listarPagamentosSchema = z.object({
  query: z.object({
    params: z.object({ alunoId: z.string().uuid().optional(),}),
    status: z.enum(['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']).optional(),
    page: z.string().optional().transform(Number).default(1),
    limit: z.string().optional().transform(Number).default(20),
  }).optional(),
})

export const registrarPagamentoSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    dataPagamento: z.coerce.date(),
    valorPago: z.number().positive(),
  }),
})