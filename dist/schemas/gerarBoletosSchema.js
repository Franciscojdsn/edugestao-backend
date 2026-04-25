"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerarPagamentoAvulsoSchema = exports.gerarBoletosContratoSchema = void 0;
const zod_1 = require("zod");
exports.gerarBoletosContratoSchema = zod_1.z.object({
    params: zod_1.z.object({
        contratoId: zod_1.z.string().uuid('ID de contrato inválido'),
    }),
    body: zod_1.z.object({
        meses: zod_1.z.number().int().min(1).max(12).default(12),
        mesInicio: zod_1.z.number().int().min(1).max(12).default(1),
        anoInicio: zod_1.z.number().int().min(2024).max(2030).default(2026),
    }),
});
exports.gerarPagamentoAvulsoSchema = zod_1.z.object({
    body: zod_1.z.object({
        alunoId: zod_1.z.string().uuid(),
        referencia: zod_1.z.string().min(1),
        valorTotal: zod_1.z.number().positive(),
        dataVencimento: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        observacoes: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=gerarBoletosSchema.js.map