import { z } from 'zod'

export const historicoEscolarSchema = z.object({
  params: z.object({
    alunoId: z.string().uuid('ID de aluno inválido'),
  }),
  query: z.object({
    anoInicio: z.string().regex(/^\d{4}$/).transform(Number).optional(),
    anoFim: z.string().regex(/^\d{4}$/).transform(Number).optional(),
    incluirFrequencia: z.string().regex(/^(true|false)$/).transform(val => val === 'true').optional(),
    incluirFinanceiro: z.string().regex(/^(true|false)$/).transform(val => val === 'true').optional(),
  }).optional(),
})

export const gerarPDFHistoricoSchema = z.object({
  params: z.object({
    alunoId: z.string().uuid(),
  }),
  query: z.object({
    ano: z.string().regex(/^\d{4}$/).transform(Number),
  }),
})