import { z } from 'zod'

export const criarEventoSchema = z.object({
  body: z.object({
    titulo: z.string().min(3).max(200),
    descricao: z.string().optional(),
    tipo: z.enum(['AULA', 'PROVA', 'REUNIAO', 'FERIADO', 'EVENTO_ESCOLAR', 'RECESSO', 'FERIAS', 'OUTROS']),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    horaInicio: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    horaFim: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    diaLetivo: z.boolean().default(true),
    publico: z.boolean().default(true),
    turmaId: z.string().uuid().optional(),
  }),
})

export const atualizarEventoSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    titulo: z.string().min(3).max(200).optional(),
    descricao: z.string().optional(),
    tipo: z.enum(['AULA', 'PROVA', 'REUNIAO', 'FERIADO', 'EVENTO_ESCOLAR', 'RECESSO', 'FERIAS', 'OUTROS']).optional(),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    horaInicio: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    horaFim: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    diaLetivo: z.boolean().optional(),
    publico: z.boolean().optional(),
    turmaId: z.string().uuid().optional(),
  }),
})

export const listarEventosSchema = z.object({
  query: z.object({
    tipo: z.enum(['AULA', 'PROVA', 'REUNIAO', 'FERIADO', 'EVENTO_ESCOLAR', 'RECESSO', 'FERIAS', 'OUTROS']).optional(),
    turmaId: z.string().uuid().optional(),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    publico: z.string().regex(/^(true|false)$/).transform(val => val === 'true').optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }).optional(),
})