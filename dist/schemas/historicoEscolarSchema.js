"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerarPDFHistoricoSchema = exports.historicoEscolarSchema = void 0;
const zod_1 = require("zod");
exports.historicoEscolarSchema = zod_1.z.object({
    params: zod_1.z.object({
        alunoId: zod_1.z.string().uuid('ID de aluno inválido'),
    }),
    query: zod_1.z.object({
        anoInicio: zod_1.z.string().regex(/^\d{4}$/).transform(Number).optional(),
        anoFim: zod_1.z.string().regex(/^\d{4}$/).transform(Number).optional(),
        incluirFrequencia: zod_1.z.string().regex(/^(true|false)$/).transform(val => val === 'true').optional(),
        incluirFinanceiro: zod_1.z.string().regex(/^(true|false)$/).transform(val => val === 'true').optional(),
    }).optional(),
});
exports.gerarPDFHistoricoSchema = zod_1.z.object({
    params: zod_1.z.object({
        alunoId: zod_1.z.string().uuid(),
    }),
    query: zod_1.z.object({
        ano: zod_1.z.string().regex(/^\d{4}$/).transform(Number),
    }),
});
//# sourceMappingURL=historicoEscolarSchema.js.map