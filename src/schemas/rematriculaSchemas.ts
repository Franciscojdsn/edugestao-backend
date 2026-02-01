import { z } from 'zod'

export const gerarRematriculasMassaSchema = z.object({
  body: z.object({
    anoAnterior: z.number().int().min(2024).max(2030),
    anoNovo: z.number().int().min(2025).max(2031),
  }),
})

export const confirmarRematriculaSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    turmaNovaId: z.string().uuid().optional(),
    valorNovo: z.number().positive().optional(),
    observacoes: z.string().optional(),
  }).optional(),
})

export const recusarRematriculaSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    observacoes: z.string().min(10, 'Informe o motivo da recusa').optional(),
  }).optional(),
})

export const listarRematriculasSchema = z.object({
  query: z.object({
    status: z.enum(['PENDENTE', 'CONFIRMADA', 'RECUSADA', 'CANCELADA']).optional(),
    anoNovo: z.string().regex(/^\d{4}$/).transform(Number).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }).optional(),
})