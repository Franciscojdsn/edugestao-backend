import { z } from 'zod'

export const portalBaseSchema = z.object({
    query: z.object({
        responsavelId: z.string().uuid('ID do responsável inválido'),
    }),
})

export const portalFiltroSchema = z.object({
    query: z.object({
        responsavelId: z.string().uuid('ID do responsável inválido'),
        anoLetivo: z.string().regex(/^\d{4}$/).transform(Number).optional(),
        status: z.string().optional(),
    }),
})