"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suspenderContratoSchema = exports.listarContratosSchema = exports.atualizarContratoSchema = exports.criarContratoSchema = void 0;
const zod_1 = require("zod");
exports.criarContratoSchema = zod_1.z.object({
    body: zod_1.z.object({
        alunoId: zod_1.z.string().uuid(),
        responsavelFinanceiroId: zod_1.z.string().uuid(),
        valorMensalidade: zod_1.z.number().positive(),
        diaVencimento: zod_1.z.number().int().min(1).max(31),
        dataInicio: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        dataFim: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        observacoes: zod_1.z.string().max(1000).optional(),
    }),
});
exports.atualizarContratoSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        valorMensalidade: zod_1.z.number().positive().optional(),
        diaVencimento: zod_1.z.number().int().min(1).max(31).optional(),
        dataFim: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        status: zod_1.z.enum(['ATIVO', 'SUSPENSO', 'CANCELADO']).optional(),
    }),
});
exports.listarContratosSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.enum(['ATIVO', 'SUSPENSO', 'CANCELADO']).optional(),
        alunoId: zod_1.z.string().uuid().optional(),
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }).optional(),
});
exports.suspenderContratoSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID do contrato inválido'),
    }),
    body: zod_1.z.object({
        motivo: zod_1.z.string().min(5, 'O motivo deve ter no mínimo 5 caracteres').max(255).optional(),
    }),
});
//# sourceMappingURL=contratoSchemas.js.map