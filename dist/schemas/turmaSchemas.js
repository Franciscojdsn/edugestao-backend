"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idTurmaSchema = exports.listarTurmasSchema = exports.atualizarTurmaSchema = exports.criarTurmaSchema = void 0;
const zod_1 = require("zod");
/**
 * Schema para criar turma
 */
exports.criarTurmaSchema = zod_1.z.object({
    body: zod_1.z.object({
        nome: zod_1.z.string()
            .min(3, 'Nome deve ter no mínimo 3 caracteres')
            .max(50, 'Nome muito longo'),
        anoLetivo: zod_1.z.number()
            .int('Ano deve ser número inteiro')
            .min(2000, 'Ano inválido')
            .max(2100, 'Ano inválido'),
        turno: zod_1.z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL'], {
            error: () => ({ message: 'Turno inválido' })
        }),
        capacidadeMaxima: zod_1.z.number()
            .int('Capacidade deve ser número inteiro')
            .positive('Capacidade deve ser positiva')
            .optional(),
        professorResponsavelId: zod_1.z.string()
            .uuid('ID de professor inválido')
            .optional(),
    }),
});
/**
 * Schema para atualizar turma
 */
exports.atualizarTurmaSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID de turma inválido'),
    }),
    body: zod_1.z.object({
        nome: zod_1.z.string()
            .min(3, 'Nome deve ter no mínimo 3 caracteres')
            .max(100, 'Nome muito longo')
            .optional(),
        ano: zod_1.z.number()
            .int('Ano deve ser número inteiro')
            .min(2000, 'Ano inválido')
            .max(2100, 'Ano inválido')
            .optional(),
        turno: zod_1.z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL'])
            .optional(),
        capacidadeMaxima: zod_1.z.number()
            .int('Capacidade deve ser número inteiro')
            .positive('Capacidade deve ser positiva')
            .optional(),
        professorResponsavelId: zod_1.z.string().uuid().nullable().optional(),
    }),
});
/**
 * Schema para listar turmas com filtros
 */
exports.listarTurmasSchema = zod_1.z.object({
    query: zod_1.z.object({
        anoLetivo: zod_1.z.string()
            .transform(Number)
            .optional(),
        turno: zod_1.z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL'])
            .optional(),
        busca: zod_1.z.string()
            .min(1)
            .optional(),
    }).optional(),
});
/**
 * Schema para buscar por ID
 */
exports.idTurmaSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID de turma inválido'),
    }),
});
//# sourceMappingURL=turmaSchemas.js.map