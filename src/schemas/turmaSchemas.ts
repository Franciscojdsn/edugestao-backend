import { z } from 'zod'

/**
 * Schema para criar turma
 */
export const criarTurmaSchema = z.object({
  body: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter no mínimo 3 caracteres')
      .max(50, 'Nome muito longo'),

    anoLetivo: z.number()
      .int('Ano deve ser número inteiro')
      .min(2000, 'Ano inválido')
      .max(2100, 'Ano inválido'),

    turno: z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL'], {
      error: () => ({ message: 'Turno inválido' })
    }),

    capacidadeMaxima: z.number()
      .int('Capacidade deve ser número inteiro')
      .positive('Capacidade deve ser positiva')
      .optional(),

    professorResponsavelId: z.string()
      .uuid('ID de professor inválido')
      .optional(),
  }),
})

/**
 * Schema para atualizar turma
 */
export const atualizarTurmaSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de turma inválido'),
  }),
  body: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter no mínimo 3 caracteres')
      .max(100, 'Nome muito longo')
      .optional(),


    ano: z.number()
      .int('Ano deve ser número inteiro')
      .min(2000, 'Ano inválido')
      .max(2100, 'Ano inválido')
      .optional(),

    turno: z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL'])
      .optional(),

    capacidadeMaxima: z.number()
      .int('Capacidade deve ser número inteiro')
      .positive('Capacidade deve ser positiva')
      .optional(),

    professorResponsavelId: z.string().uuid().nullable().optional(),
  }),
})

/**
 * Schema para listar turmas com filtros
 */
export const listarTurmasSchema = z.object({
  query: z.object({
    anoLetivo: z.string()
      .transform(Number)
      .optional(),

    turno: z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL'])
      .optional(),


    busca: z.string()
      .min(1)
      .optional(),
  }).optional(),
})

/**
 * Schema para buscar por ID
 */
export const idTurmaSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de turma inválido'),
  }),
})
