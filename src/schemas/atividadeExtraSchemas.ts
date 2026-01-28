import { z } from 'zod'

export const criarAtividadeSchema = z.object({
  body: z.object({
    nome: z.string().min(3).max(100),
    descricao: z.string().max(500).optional(),
    valor: z.number().positive(),
    diaAula: z.enum(['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO']),
    horario: z.string().regex(/^\d{2}:\d{2}$/),
    capacidadeMaxima: z.number().int().positive().optional(),
  }),
})

export const atualizarAtividadeSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    nome: z.string().min(3).max(100).optional(),
    descricao: z.string().max(500).optional(),
    valor: z.number().positive().optional(),
    diaAula: z.enum(['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO']).optional(),
    horario: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    capacidadeMaxima: z.number().int().positive().optional(),
  }),
})

export const vincularAlunoAtividadeSchema = z.object({
  params: z.object({ atividadeId: z.string().uuid() }),
  body: z.object({ alunoId: z.string().uuid() }),
})

export const desvincularAlunoAtividadeSchema = z.object({
  params: z.object({
    atividadeId: z.string().uuid(),
    alunoId: z.string().uuid(),
  }),
})