import { z } from 'zod'

export const registrarChamadaSchema = z.object({
  body: z.object({
    turmaId: z.string().uuid(),
    disciplinaId: z.string().uuid().optional(),
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    presencas: z.array(
      z.object({
        alunoId: z.string().uuid(),
        presente: z.boolean(),
        justificativa: z.string().optional(),
      })
    ).min(1),
  }),
})

export const listarFrequenciaSchema = z.object({
  query: z.object({
    turmaId: z.string().uuid().optional(),
    alunoId: z.string().uuid().optional(),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }).optional(),
})

export const relatorioFrequenciaSchema = z.object({
  params: z.object({
    alunoId: z.string().uuid(),
  }),
  query: z.object({
    mesInicio: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    mesFim: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  }).optional(),
})