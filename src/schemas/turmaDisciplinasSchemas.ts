import { z } from 'zod'

export const vincularDisciplinaSchema = z.object({
  params: z.object({
    turmaId: z.string().uuid(),
  }),
  body: z.object({
    disciplinaId: z.string().uuid(),
  }),
})

export const desvincularDisciplinaSchema = z.object({
  params: z.object({
    turmaId: z.string().uuid(),
    disciplinaId: z.string().uuid(),
  }),
})

export const listarDisciplinasTurmaSchema = z.object({
  params: z.object({
    turmaId: z.string().uuid(),
  }),
})