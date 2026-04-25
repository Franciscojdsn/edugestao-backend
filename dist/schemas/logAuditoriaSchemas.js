"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detalhesLogSchema = exports.estatisticasLogsSchema = exports.listarLogsSchema = void 0;
const zod_1 = require("zod");
exports.listarLogsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        entidade: zod_1.z.string().optional(),
        acao: zod_1.z.string().optional(),
        usuarioId: zod_1.z.string().uuid('ID de usuário inválido').optional(),
        dataInicio: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data deve ser YYYY-MM-DD').optional(),
        dataFim: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data deve ser YYYY-MM-DD').optional(),
    }).optional(),
});
exports.estatisticasLogsSchema = zod_1.z.object({
    query: zod_1.z.object({
        dataInicio: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        dataFim: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }).optional(),
});
exports.detalhesLogSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID de log inválido'),
    }),
});
//# sourceMappingURL=logAuditoriaSchemas.js.map