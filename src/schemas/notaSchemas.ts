import { z } from 'zod'

export const criarNotaSchema = z.object({
  body: z.object({
    alunoId: z.string().uuid(),
    disciplinaId: z.string().uuid(),
    turmaId: z.string().uuid(), 
    valor: z.number().min(0).max(10),
    bimestre: z.number().int().min(1).max(4),
    anoLetivo: z.number().int().min(2000).max(2100),
    observacao: z.string().max(500).optional(),
  }),
})

export const atualizarNotaSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    valor: z.number().min(0).max(10).optional(),
    observacao: z.string().max(500).optional(),
  }),
})

export const listarNotasSchema = z.object({
  query: z.object({
    alunoId: z.string().uuid().optional(),
    disciplinaId: z.string().uuid().optional(),
    bimestre: z.string().regex(/^[1-4]$/).transform(Number).optional(),
    anoLetivo: z.string().regex(/^\d+$/).transform(Number).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }).optional(),
})

export const boletimAlunoSchema = z.object({
  params: z.object({
    alunoId: z.string().uuid(),
  }),
  query: z.object({
    anoLetivo: z.string().regex(/^\d+$/).transform(Number),
  }),
})