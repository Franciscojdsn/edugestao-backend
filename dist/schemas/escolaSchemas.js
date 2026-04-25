"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamSchema = exports.atualizarEscolaSchema = exports.criarEscolaSchema = void 0;
const zod_1 = require("zod");
// Schema para criar escola
exports.criarEscolaSchema = zod_1.z.object({
    body: zod_1.z.object({
        nome: zod_1.z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
        cnpj: zod_1.z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
        telefone: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Email inválido').optional(),
        mensalidadePadrao: zod_1.z.number().positive('Valor deve ser positivo').optional(),
        diaVencimento: zod_1.z.number().int().min(1).max(31, 'Dia deve ser entre 1 e 31').optional(),
    }),
});
// Schema para atualizar escola
exports.atualizarEscolaSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID inválido'),
    }),
    body: zod_1.z.object({
        nome: zod_1.z.string().min(3).optional(),
        cnpj: zod_1.z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/).optional(),
        telefone: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        mensalidadePadrao: zod_1.z.number().positive().optional(),
        diaVencimento: zod_1.z.number().int().min(1).max(31).optional(),
    }),
});
// Schema para buscar por ID
exports.idParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID inválido'),
    }),
});
//# sourceMappingURL=escolaSchemas.js.map