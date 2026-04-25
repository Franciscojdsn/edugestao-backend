"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idAlunoSchema = exports.listarAlunosSchema = exports.atualizarAlunoSchema = exports.criarAlunoSchema = void 0;
const zod_1 = require("zod");
// ============================================
// SCHEMAS DE VALIDAÇÃO - ALUNO
// ============================================
/**
 * Schema para criar aluno (VERSÃO SIMPLES - sem responsáveis)
 */
exports.criarAlunoSchema = zod_1.z.object({
    body: zod_1.z.object({
        nome: zod_1.z.string()
            .min(3, 'Nome deve ter no mínimo 3 caracteres')
            .max(100, 'Nome muito longo'),
        cpf: zod_1.z.string()
            .transform(val => val.replace(/\D/g, ''))
            .refine(val => val.length === 11, "CPF deve ter 11 dígitos")
            .optional(),
        dataNascimento: zod_1.z.preprocess((val) => {
            if (typeof val === "string") {
                const dateString = val.length === 10 ? `${val}T12:00:00Z` : val;
                const date = new Date(dateString);
                return isNaN(date.getTime()) ? undefined : date;
            }
            return val;
        }, zod_1.z.date().optional()),
        numeroMatricula: zod_1.z.string()
            .min(1, 'Número de matrícula é obrigatório')
            .max(50, 'Matrícula muito longa'),
        turmaId: zod_1.z.string()
            .uuid('ID de turma inválido')
            .optional(),
        enderecoId: zod_1.z.string()
            .uuid('ID de endereço inválido')
            .optional(),
    }),
});
/**
 * Schema para atualizar aluno
 */
exports.atualizarAlunoSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID inválido'),
    }),
    body: zod_1.z.object({
        nome: zod_1.z.string()
            .min(3, 'Nome deve ter no mínimo 3 caracteres')
            .max(100, 'Nome muito longo')
            .optional(),
        cpf: zod_1.z.string()
            .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (formato: 000.000.000-00)')
            .optional(),
        dataNascimento: zod_1.z.string()
            .datetime({ message: 'Data inválida' })
            .optional()
            .or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
        turmaId: zod_1.z.string()
            .uuid('ID de turma inválido')
            .nullable()
            .optional(),
        enderecoId: zod_1.z.string()
            .uuid('ID de endereço inválido')
            .nullable()
            .optional(),
    }),
});
/**
 * Schema para listar alunos com filtros
 */
exports.listarAlunosSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string()
            .regex(/^\d+$/, 'Page deve ser número')
            .transform(Number)
            .optional(),
        limit: zod_1.z.string()
            .regex(/^\d+$/, 'Limit deve ser número')
            .transform(Number)
            .optional(),
        turmaId: zod_1.z.string()
            .uuid('ID de turma inválido')
            .optional(),
        busca: zod_1.z.string()
            .min(1)
            .optional(),
    }).optional(),
});
/**
 * Schema para buscar por ID (usado em GET, PUT, DELETE)
 */
exports.idAlunoSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID inválido'),
    }),
});
//# sourceMappingURL=alunoSchemas.js.map