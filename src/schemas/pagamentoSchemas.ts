import { z } from 'zod'

export const criarPagamentoSchema = z.object({
  body: z.object({
    alunoId: z.string().uuid(),
    referencia: z.string().min(1),
    valorTotal: z.number().positive(),
    dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
})

export const atualizarPagamentoSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']).optional(),
    dataPagamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    valorPago: z.number().positive().optional(),
  }),
})

export const listarPagamentosSchema = z.object({
  query: z.object({
    alunoId: z.string().uuid().optional(),
    status: z.enum(['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }).optional(),
})

export const registrarPagamentoSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    dataPagamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    valorPago: z.number().positive(),
  }),
})