"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idResponsavelSchema = exports.listarResponsaveisSchema = exports.listarResponsaveisAlunoSchema = exports.atualizarResponsavelSchema = exports.criarResponsavelSchema = void 0;
const zod_1 = require("zod");
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
exports.criarResponsavelSchema = zod_1.z.object({
    body: zod_1.z.object({
        alunoId: zod_1.z.string()
            .uuid('ID de aluno inválido'),
        nome: zod_1.z.string()
            .min(3, 'Nome deve ter no mínimo 3 caracteres')
            .max(100, 'Nome muito longo'),
        tipo: zod_1.z.enum(['PAI', 'MAE', 'TUTOR', 'OUTROS'], {
            error: () => ({ message: 'Tipo inválido. Use: PAI, MAE, TUTOR ou OUTROS' })
        }),
        cpf: zod_1.z.string()
            .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (formato: 000.000.000-00)')
            .optional(),
        escolaId: zod_1.z.string()
            .uuid('ID de escola inválido')
            .optional(),
        email: zod_1.z.string()
            .email('Email inválido')
            .optional(),
        telefone1: zod_1.z.string()
            .min(10, 'Telefone inválido')
            .max(20, 'Telefone muito longo')
            .regex(/^\+?\d{10,20}$/, 'Telefone deve conter apenas números e opcionalmente começar com +')
            .optional(),
        telefone2: zod_1.z.string()
            .min(10, 'Telefone inválido')
            .max(20, 'Telefone muito longo')
            .regex(/^\+?\d{10,20}$/, 'Telefone deve conter apenas números e opcionalmente começar com +')
            .optional(),
        isResponsavelFinanceiro: zod_1.z.boolean(),
        // Simplificou! Só espera o ID ou o Objeto
        enderecoId: zod_1.z.string().uuid("ID de endereço inválido").optional(),
        endereco: zod_1.z.object({
            cep: zod_1.z.string(),
            rua: zod_1.z.string(),
            numero: zod_1.z.string(),
            complemento: zod_1.z.string().optional(),
            bairro: zod_1.z.string(),
            cidade: zod_1.z.string(),
            estado: zod_1.z.string().length(2)
        }).optional()
    }).refine((data) => data.enderecoId || data.endereco, {
        message: "É obrigatório enviar o enderecoId do aluno OU os dados de um novo endereço.",
        path: ["endereco"] // Aponta o erro caso ambos venham vazios
    })
});
/**
 * SCHEMA: Atualizar Responsável
 *
 * Todos os campos são opcionais exceto o ID.
 * Não permite alterar o alunoId (vínculo fixo).
 */
exports.atualizarResponsavelSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID inválido'),
    }),
    body: zod_1.z.object({
        nome: zod_1.z.string()
            .min(3, 'Nome deve ter no mínimo 3 caracteres')
            .max(100, 'Nome muito longo')
            .optional(),
        tipo: zod_1.z.enum(['PAI', 'MAE', 'TUTOR', 'OUTROS'])
            .optional(),
        cpf: zod_1.z.string()
            .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
            .optional(),
        escolaId: zod_1.z.string()
            .uuid('ID de escola inválido')
            .optional(),
        email: zod_1.z.string()
            .email('Email inválido')
            .optional(),
        telefone1: zod_1.z.string()
            .min(10, 'Telefone inválido')
            .max(20, 'Telefone muito longo')
            .regex(/^\+?\d{10,20}$/, 'Telefone deve conter apenas números e opcionalmente começar com +')
            .optional(),
        telefone2: zod_1.z.string()
            .min(10, 'Telefone inválido')
            .max(20, 'Telefone muito longo')
            .regex(/^\+?\d{10,20}$/, 'Telefone deve conter apenas números e opcionalmente começar com +')
            .optional(),
        isResponsavelFinanceiro: zod_1.z.boolean()
            .optional(),
        enderecoId: zod_1.z.string()
            .uuid()
            .nullable()
            .optional(),
    }),
});
/**
 * SCHEMA: Listar Responsáveis de um Aluno
 *
 * Valida o ID do aluno nos params.
 */
exports.listarResponsaveisAlunoSchema = zod_1.z.object({
    params: zod_1.z.object({
        alunoId: zod_1.z.string().uuid('ID de aluno inválido'),
    }),
});
/**
 * SCHEMA: Listar Todos os Responsáveis (Admin)
 *
 * Permite busca e paginação.
 */
exports.listarResponsaveisSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string()
            .regex(/^\d+$/)
            .transform(Number)
            .optional(),
        limit: zod_1.z.string()
            .regex(/^\d+$/)
            .transform(Number)
            .optional(),
        busca: zod_1.z.string()
            .min(1)
            .optional(),
        tipo: zod_1.z.enum(['PAI', 'MAE', 'TUTOR', 'OUTROS'])
            .optional(),
        isResponsavelFinanceiro: zod_1.z.string()
            .regex(/^(true|false)$/)
            .transform(val => val === 'true')
            .optional(),
    }).optional(),
});
/**
 * SCHEMA: Buscar por ID
 */
exports.idResponsavelSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID inválido'),
    }),
});
//# sourceMappingURL=responsavelSchemas.js.map