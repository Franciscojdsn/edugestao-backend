import { z } from 'zod'

/**
 * SCHEMA: Criar Responsável
 * Valida os dados para criar um novo responsável vinculado a um aluno.
 */
const normalizeNumbers = (val: string) => val.replace(/\D/g, '');

export const criarResponsavelSchema = z.object({
    body: z.object({
        alunoId: z.string().uuid('ID de aluno inválido'),

        nome: z.string()
            .min(3, 'Nome deve ter no mínimo 3 caracteres')
            .max(100, 'Nome excede 100 caracteres')
            .trim(),

        tipo: z.enum(['PAI', 'MAE', 'AVO', 'TUTOR', 'OUTRO']), // Corrigido para bater com o Prisma

        cpf: z.string()
            .transform(normalizeNumbers)
            .refine(val => val.length === 11 || val === '', 'CPF deve ter 11 dígitos')
            .optional().nullable(),

        rg: z.string().min(5, 'RG muito curto').max(20, 'RG muito longo').trim().optional().nullable(),

        telefone1: z.string()
            .min(10, 'Telefone muito curto')
            .max(15, 'Telefone excede limite')
            .transform(normalizeNumbers)
            .optional()
            .nullable(),

        telefone2: z.string()
            .max(15)
            .transform(normalizeNumbers)
            .optional().nullable(),

        email: z.string()
            .email('Email inválido')
            .max(70)
            .toLowerCase()
            .trim()
            .optional().nullable(),

        isResponsavelFinanceiro: z.boolean().default(false),

        enderecoId: z.string().uuid().optional().nullable(),

        // AVISO DO ARQUITETO: escolaId foi removido intencionalmente do Body. 
        // Ele será injetado silenciosamente pelo backend.
    }),
});

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
    // Aplica o partial apenas no objeto 'body' do schema original
    body: criarResponsavelSchema.shape.body.partial()
});

/**
 * SCHEMA: Listar Responsáveis de um Aluno
 */
export const listarResponsaveisAlunoSchema = z.object({
    params: z.object({
        alunoId: z.string().uuid('ID de aluno inválido'),
    }),
})

/**
 * SCHEMA: Listar Todos os Responsáveis (Admin)
 */
export const listarResponsaveisSchema = z.object({
    query: z.object({
        page: z.string()
            .regex(/^\d+$/)
            .transform(Number)
            .pipe(z.number().min(1))
            .optional(),

        limit: z.string()
            .regex(/^\d+$/)
            .transform(Number)
            .pipe(z.number().min(1).max(100))
            .optional(),

        busca: z.string()
            .min(1)
            .max(50, 'Busca muito longa')
            .optional(),

        tipo: z.enum(['PAI', 'MAE', 'AVO', 'TUTOR', 'OUTRO'])
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