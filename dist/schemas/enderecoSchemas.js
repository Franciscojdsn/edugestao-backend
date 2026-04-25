"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atualizarEnderecoSchema = exports.criarEnderecoSchema = void 0;
const zod_1 = require("zod");
exports.criarEnderecoSchema = zod_1.z.object({
    body: zod_1.z.object({
        rua: zod_1.z.string().min(3).max(200),
        numero: zod_1.z.string().max(20),
        complemento: zod_1.z.string().max(100).optional(),
        bairro: zod_1.z.string().min(3).max(100),
        cidade: zod_1.z.string().min(3).max(100),
        estado: zod_1.z.string().length(2).toUpperCase(),
        cep: zod_1.z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido (formato: 00000-000)'),
    }),
});
exports.atualizarEnderecoSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
    body: zod_1.z.object({
        rua: zod_1.z.string().min(3).max(200).optional(),
        numero: zod_1.z.string().max(20).optional(),
        complemento: zod_1.z.string().max(100).optional(),
        bairro: zod_1.z.string().min(3).max(100).optional(),
        cidade: zod_1.z.string().min(3).max(100).optional(),
        estado: zod_1.z.string().length(2).toUpperCase().optional(),
        cep: zod_1.z.string().regex(/^\d{5}-\d{3}$/).optional(),
    }),
});
//# sourceMappingURL=enderecoSchemas.js.map