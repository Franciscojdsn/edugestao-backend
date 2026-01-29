import { z } from 'zod'

export const relatorioFinanceiroSchema = z.object({
  query: z.object({
    mes: z.string().regex(/^\d{1,2}$/).transform(Number).optional(),
    ano: z.string().regex(/^\d{4}$/).transform(Number).optional(),
  }).optional(),
})

export const relatorioPedagogicoSchema = z.object({
  query: z.object({
    turmaId: z.string().uuid().optional(),
    anoLetivo: z.string().regex(/^\d{4}$/).transform(Number).optional(),
  }).optional(),
})

export const relatorioFrequenciaSchema = z.object({
  query: z.object({
    anoLetivo: z.string().regex(/^\d{4}$/).transform(Number).optional(),
  }).optional(),
})