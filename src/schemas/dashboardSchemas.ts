import { z } from 'zod'

export const dashboardFiltroSchema = z.object({
    query: z.object({
        mes: z.string().regex(/^\d+$/).transform(Number).refine(m => m >= 1 && m <= 12).optional(),
        ano: z.string().regex(/^\d{4}$/).transform(Number).optional(),
        turmaId: z.string().uuid().optional(),
    }),
})