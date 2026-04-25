"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listarRematriculasSchema = exports.recusarRematriculaSchema = exports.confirmarRematriculaSchema = exports.gerarRematriculasMassaSchema = void 0;
const zod_1 = require("zod");
exports.gerarRematriculasMassaSchema = zod_1.z.object({
    body: zod_1.z.object({
        anoAnterior: zod_1.z.number().int().min(2024).max(2030),
        anoNovo: zod_1.z.number().int().min(2025).max(2031),
    }),
});
exports.confirmarRematriculaSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        turmaNovaId: zod_1.z.string().uuid().optional(),
        valorNovo: zod_1.z.number().positive().optional(),
        observacoes: zod_1.z.string().optional(),
    }).optional(),
});
exports.recusarRematriculaSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        observacoes: zod_1.z.string().min(10, 'Informe o motivo da recusa').optional(),
    }).optional(),
});
exports.listarRematriculasSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.enum(['PENDENTE', 'CONFIRMADA', 'RECUSADA', 'CANCELADA']).optional(),
        anoNovo: zod_1.z.string().regex(/^\d{4}$/).transform(Number).optional(),
        nomeAluno: zod_1.z.string().optional(), // Nova melhoria de busca
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});
//# sourceMappingURL=rematriculaSchemas.js.map