import { z } from 'zod'

export const criarGradeSchema = z.object({
    body: z.object({
        diaSemana: z.number().min(0).max(6, 'Dia deve ser entre 0 (Dom) e 6 (Sáb)'),
        horarioInicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm inválido'),
        horarioFim: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm inválido'),
        turmaDisciplinaId: z.string().uuid('ID de vínculo inválido'),
    }),
})

export const listarGradeTurmaSchema = z.object({
    params: z.object({
        turmaId: z.string().uuid('ID de turma inválido'),
    }),
})

export const listarPorTurmaSchema = z.object({
    params: z.object({
        turmaId: z.string().uuid('ID de turma inválido'),
    }),
})