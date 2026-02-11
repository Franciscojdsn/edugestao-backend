import { z } from 'zod'

export const listarLogsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    entidade: z.string().optional(),
    acao: z.string().optional(),
    usuarioId: z.string().uuid('ID de usuário inválido').optional(),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data deve ser YYYY-MM-DD').optional(),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data deve ser YYYY-MM-DD').optional(),
  }).optional(),
})

export const estatisticasLogsSchema = z.object({
  query: z.object({
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }).optional(),
})

export const detalhesLogSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de log inválido'),
  }),
})