import { z } from 'zod'

export const escalonarPagamentoSchema = z.object({
  params: z.object({
    pagamentoId: z.string().uuid(),
  }),
})

export const resumoPendenciasSchema = z.object({
  query: z.object({
    alunoId: z.string().uuid().optional(),
    turmaId: z.string().uuid().optional(),
  }).optional(),
})