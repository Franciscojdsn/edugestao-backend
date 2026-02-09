import { z } from 'zod'

// ============================================
// SCHEMAS DE VALIDAÇÃO - ALUNO
// ============================================

/**
 * Schema para criar aluno (VERSÃO SIMPLES - sem responsáveis)
 */
export const criarAlunoSchema = z.object({
  body: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter no mínimo 3 caracteres')
      .max(100, 'Nome muito longo'),

    cpf: z.string()
      .transform(val => val.replace(/\D/g, ''))
      .refine(val => val.length === 11, "CPF deve ter 11 dígitos")
      .optional(),

    dataNascimento: z.preprocess((val) => {
      if (typeof val === "string") {
        const dateString = val.length === 10 ? `${val}T12:00:00Z` : val;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return val;
    }, z.date().optional()),

    numeroMatricula: z.string()
      .min(1, 'Número de matrícula é obrigatório')
      .max(50, 'Matrícula muito longa'),

    turno: z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL'], {
      error: () => ({ message: 'Turno inválido' })
    }).optional(),

    turmaId: z.string()
      .uuid('ID de turma inválido')
      .optional(),

    enderecoId: z.string()
      .uuid('ID de endereço inválido')
      .optional(),
  }),
})

/**
 * Schema para atualizar aluno
 */
export const atualizarAlunoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter no mínimo 3 caracteres')
      .max(100, 'Nome muito longo')
      .optional(),

    cpf: z.string()
      .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (formato: 000.000.000-00)')
      .optional(),

    dataNascimento: z.string()
      .datetime({ message: 'Data inválida' })
      .optional()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),

    turno: z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL'])
      .optional(),

    turmaId: z.string()
      .uuid('ID de turma inválido')
      .nullable()
      .optional(),

    enderecoId: z.string()
      .uuid('ID de endereço inválido')
      .nullable()
      .optional(),
  }),
})

/**
 * Schema para listar alunos com filtros
 */
export const listarAlunosSchema = z.object({
  query: z.object({
    page: z.string()
      .regex(/^\d+$/, 'Page deve ser número')
      .transform(Number)
      .optional(),

    limit: z.string()
      .regex(/^\d+$/, 'Limit deve ser número')
      .transform(Number)
      .optional(),

    turmaId: z.string()
      .uuid('ID de turma inválido')
      .optional(),

    turno: z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL'])
      .optional(),

    busca: z.string()
      .min(1)
      .optional(),
  }).optional(),
})

/**
 * Schema para buscar por ID (usado em GET, PUT, DELETE)
 */
export const idAlunoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
})
