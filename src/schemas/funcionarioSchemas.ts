import { z } from 'zod'

// ============================================
// SCHEMAS DE VALIDAÇÃO - FUNCIONÁRIO
// ============================================

/**
 * Schema para criar funcionário
 */
export const criarFuncionarioSchema = z.object({
  body: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter no mínimo 3 caracteres')
      .max(100, 'Nome muito longo'),
    
    cpf: z.string()
      .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (formato: 000.000.000-00)'),
    
    cargo: z.enum([
      'PROFESSOR',
      'COORDENADOR',
      'DIRETOR',
      'SECRETARIO',
      'AUXILIAR',
      'ZELADOR',
      'OUTRO'
    ], {
      errorMap: () => ({ message: 'Cargo inválido' })
    }),
    
    especialidade: z.string()
      .max(100, 'Especialidade muito longa')
      .optional(),
    
    telefone: z.string()
      .min(10, 'Telefone inválido')
      .max(20, 'Telefone muito longo')
      .optional(),
    
    email: z.string()
      .email('Email inválido')
      .optional(),
    
    dataAdmissao: z.string()
      .datetime({ message: 'Data inválida (formato ISO)' })
      .optional()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato: YYYY-MM-DD)').optional()),
    
    salario: z.number()
      .positive('Salário deve ser positivo')
      .optional(),
    
    enderecoId: z.string()
      .uuid('ID de endereço inválido')
      .optional(),
  }),
})

/**
 * Schema para atualizar funcionário
 */
export const atualizarFuncionarioSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter no mínimo 3 caracteres')
      .max(100, 'Nome muito longo')
      .optional(),
    
    cpf: z.string()
      .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
      .optional(),
    
    cargo: z.enum([
      'PROFESSOR',
      'COORDENADOR',
      'DIRETOR',
      'SECRETARIO',
      'AUXILIAR',
      'ZELADOR',
      'OUTRO'
    ]).optional(),
    
    especialidade: z.string()
      .max(100, 'Especialidade muito longa')
      .optional(),
    
    telefone: z.string()
      .min(10, 'Telefone inválido')
      .max(20, 'Telefone muito longo')
      .optional(),
    
    email: z.string()
      .email('Email inválido')
      .optional(),
    
    dataAdmissao: z.string()
      .datetime({ message: 'Data inválida' })
      .optional()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
    
    salario: z.number()
      .positive('Salário deve ser positivo')
      .optional(),
    
    enderecoId: z.string()
      .uuid('ID de endereço inválido')
      .nullable()
      .optional(),
  }),
})

/**
 * Schema para listar funcionários com filtros
 */
export const listarFuncionariosSchema = z.object({
  query: z.object({
    page: z.string()
      .regex(/^\d+$/, 'Page deve ser número')
      .transform(Number)
      .optional(),
    
    limit: z.string()
      .regex(/^\d+$/, 'Limit deve ser número')
      .transform(Number)
      .optional(),
    
    cargo: z.enum([
      'PROFESSOR',
      'COORDENADOR',
      'DIRETOR',
      'SECRETARIO',
      'AUXILIAR',
      'ZELADOR',
      'OUTRO'
    ]).optional(),
    
    busca: z.string()
      .min(1)
      .optional(),
  }).optional(),
})

/**
 * Schema para buscar por ID
 */
export const idFuncionarioSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
})
