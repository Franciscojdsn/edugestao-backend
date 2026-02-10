import { z } from 'zod'

export const criarCronogramaSchema = z.object({
    body: z.object({
        turmaId: z.string().uuid('ID de turma inválido'),
        disciplinasPorDia: z.array(
            z.object({
                data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data deve ser AAAA-MM-DD'),
                disciplinaId: z.string().uuid('ID de disciplina inválido'),
                ordem: z.number().int().min(1).default(1)
            })
        ).min(1, 'É necessário informar ao menos uma prova')
    })
})

export const copiarCronogramaSchema = z.object({
    body: z.object({
        turmaOrigemId: z.string().uuid(),
        turmasDestinoIds: z.array(z.string().uuid()).min(1),
        dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    })
})

export const portalResponsavelSchema = z.object({
    params: z.object({
        turmaId: z.string().uuid()
    }),
    query: z.object({
        dataInicio: z.string().optional(),
        dataFim: z.string().optional()
    })
})