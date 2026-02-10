import { z } from 'zod'

export const criarContratoSchema = z.object({
  body: z.object({
    alunoId: z.string().uuid(),
    responsavelFinanceiroId: z.string().uuid(),
    valorMensalidade: z.number().positive(),
    diaVencimento: z.number().int().min(1).max(31),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    observacoes: z.string().max(1000).optional(),
  }),
})

export const atualizarContratoSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    valorMensalidade: z.number().positive().optional(),
    diaVencimento: z.number().int().min(1).max(31).optional(),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: z.enum(['ATIVO', 'SUSPENSO', 'CANCELADO']).optional(),
  }),
})

export const listarContratosSchema = z.object({
  query: z.object({
    status: z.enum(['ATIVO', 'SUSPENSO', 'CANCELADO']).optional(),
    alunoId: z.string().uuid().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }).optional(),
})