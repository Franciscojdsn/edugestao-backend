import { z } from 'zod'

// ============================================
// SCHEMAS DE VALIDAÇÃO - TURMA
// ============================================

/**
 * Schema para criar turma
 */
export const criarTurmaSchema = z.object({
  body: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter no mínimo 3 caracteres')
      .max(100, 'Nome muito longo'),
    
    serie: z.string()
      .min(1, 'Série é obrigatória')
      .max(50, 'Série muito longa'),
    
    ano: z.number()
      .int('Ano deve ser número inteiro')
      .min(2000, 'Ano inválido')
      .max(2100, 'Ano inválido'),
    
    turno: z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL'], {
      errorMap: () => ({ message: 'Turno inválido' })
    }),
    
    capacidadeMaxima: z.number()
      .int('Capacidade deve ser número inteiro')
      .positive('Capacidade deve ser positiva')
      .optional(),
  }),
})

/**
 * Schema para atualizar turma
 */
export const atualizarTurmaSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter no mínimo 3 caracteres')
      .max(100, 'Nome muito longo')
      .optional(),
    
    serie: z.string()
      .min(1, 'Série é obrigatória')
      .max(50, 'Série muito longa')
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
  }),
})

/**
 * Schema para listar turmas com filtros
 */
export const listarTurmasSchema = z.object({
  query: z.object({
    page: z.string()
      .regex(/^\d+$/, 'Page deve ser número')
      .transform(Number)
      .optional(),
    
    limit: z.string()
      .regex(/^\d+$/, 'Limit deve ser número')
      .transform(Number)
      .optional(),
    
    ano: z.string()
      .regex(/^\d+$/, 'Ano deve ser número')
      .transform(Number)
      .optional(),
    
    turno: z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL'])
      .optional(),
    
    serie: z.string()
      .min(1)
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
    id: z.string().uuid('ID inválido'),
  }),
})
