import { z } from 'zod'

/**
 * SCHEMA: Criar Responsável
 * 
 * Valida os dados para criar um novo responsável vinculado a um aluno.
 * 
 * Campos obrigatórios:
 * - alunoId: ID do aluno (UUID)
 * - nome: Nome completo
 * - tipo: PAI, MAE, TUTOR, OUTROS
 * - telefone: Telefone de contato
 */
export const criarResponsavelSchema = z.object({
    body: z.object({
        alunoId: z.string()
            .uuid('ID de aluno inválido'),

        nome: z.string()
            .min(3, 'Nome deve ter no mínimo 3 caracteres')
            .max(100, 'Nome muito longo'),

        tipo: z.enum(['PAI', 'MAE', 'TUTOR', 'OUTROS'], {
            error: () => ({ message: 'Tipo inválido. Use: PAI, MAE, TUTOR ou OUTROS' })
        }),

        cpf: z.string()
            .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (formato: 000.000.000-00)')
            .optional(),

        escolaId: z.string()
            .uuid('ID de escola inválido')
            .optional(),

        email: z.string()
            .email('Email inválido')
            .optional(),

        telefone1: z.string()
            .min(10, 'Telefone inválido')
            .max(20, 'Telefone muito longo')
            .regex(/^\+?\d{10,20}$/, 'Telefone deve conter apenas números e opcionalmente começar com +')
            .optional(),

        telefone2: z.string()
            .min(10, 'Telefone inválido')
            .max(20, 'Telefone muito longo')
            .regex(/^\+?\d{10,20}$/, 'Telefone deve conter apenas números e opcionalmente começar com +')
            .optional(),

        isResponsavelFinanceiro: z.boolean()
            .default(false),

        enderecoId: z.string()
            .uuid('ID de endereço inválido')
            .optional(),
    }),
})

/**
 * SCHEMA: Atualizar Responsável
 * 
 * Todos os campos são opcionais exceto o ID.
 * Não permite alterar o alunoId (vínculo fixo).
 */
export const atualizarResponsavelSchema = z.object({
    params: z.object({
        id: z.string().uuid('ID inválido'),
    }),
    body: z.object({
        nome: z.string()
            .min(3, 'Nome deve ter no mínimo 3 caracteres')
            .max(100, 'Nome muito longo')
            .optional(),

        tipo: z.enum(['PAI', 'MAE', 'TUTOR', 'OUTROS'])
            .optional(),

        cpf: z.string()
            .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
            .optional(),

        escolaId: z.string()
            .uuid('ID de escola inválido')
            .optional(),

        email: z.string()
            .email('Email inválido')
            .optional(),

        telefone1: z.string()
            .min(10, 'Telefone inválido')
            .max(20, 'Telefone muito longo')
            .regex(/^\+?\d{10,20}$/, 'Telefone deve conter apenas números e opcionalmente começar com +')
            .optional(),

        telefone2: z.string()
            .min(10, 'Telefone inválido')
            .max(20, 'Telefone muito longo')
            .regex(/^\+?\d{10,20}$/, 'Telefone deve conter apenas números e opcionalmente começar com +')
            .optional(),

        isResponsavelFinanceiro: z.boolean()
            .optional(),

        enderecoId: z.string()
            .uuid()
            .nullable()
            .optional(),
    }),
})

/**
 * SCHEMA: Listar Responsáveis de um Aluno
 * 
 * Valida o ID do aluno nos params.
 */
export const listarResponsaveisAlunoSchema = z.object({
    params: z.object({
        alunoId: z.string().uuid('ID de aluno inválido'),
    }),
})

/**
 * SCHEMA: Listar Todos os Responsáveis (Admin)
 * 
 * Permite busca e paginação.
 */
export const listarResponsaveisSchema = z.object({
    query: z.object({
        page: z.string()
            .regex(/^\d+$/)
            .transform(Number)
            .optional(),

        limit: z.string()
            .regex(/^\d+$/)
            .transform(Number)
            .optional(),

        busca: z.string()
            .min(1)
            .optional(),

        tipo: z.enum(['PAI', 'MAE', 'TUTOR', 'OUTROS'])
            .optional(),

        isResponsavelFinanceiro: z.string()
            .regex(/^(true|false)$/)
            .transform(val => val === 'true')
            .optional(),
    }).optional(),
})

/**
 * SCHEMA: Buscar por ID
 */
export const idResponsavelSchema = z.object({
    params: z.object({
        id: z.string().uuid('ID inválido'),
    }),
})