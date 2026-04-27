import { z } from 'zod';

export const dashboardFiltroSchema = z.object({
    query: z.object({
        mes: z.coerce.number().int().min(1).max(12).optional(),
        ano: z.coerce.number().int().min(2024).max(2100).optional(),
        turmaId: z.string().uuid('ID de turma inválido').optional(),
    }),
});