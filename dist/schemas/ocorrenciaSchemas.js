"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listarOcorrenciasSchema = exports.atualizarOcorrenciaSchema = exports.criarOcorrenciaSchema = void 0;
const zod_1 = require("zod");
exports.criarOcorrenciaSchema = zod_1.z.object({
    body: zod_1.z.object({
        titulo: zod_1.z.string().min(3).max(200),
        descricao: zod_1.z.string().min(10),
        tipo: zod_1.z.enum(['COMPORTAMENTO', 'FALTA_DISCIPLINAR', 'BULLYING', 'ATRASO', 'UNIFORME', 'MATERIAL', 'OUTROS']),
        gravidade: zod_1.z.enum(['LEVE', 'MODERADA', 'GRAVE', 'GRAVISSIMA']).default('LEVE'),
        alunoId: zod_1.z.string().uuid(),
        funcionarioId: zod_1.z.string().uuid(),
        data: zod_1.z.string().transform((val) => new Date(val)).optional(),
        acaoTomada: zod_1.z.string().optional(),
    }),
});
exports.atualizarOcorrenciaSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        titulo: zod_1.z.string().min(3).max(200).optional(),
        descricao: zod_1.z.string().min(10).optional(),
        acaoTomada: zod_1.z.string().optional(),
        responsavelAcao: zod_1.z.string().optional(),
    }),
});
exports.listarOcorrenciasSchema = zod_1.z.object({
    query: zod_1.z.object({
        tipo: zod_1.z.enum(['COMPORTAMENTO', 'FALTA_DISCIPLINAR', 'BULLYING', 'ATRASO', 'UNIFORME', 'MATERIAL', 'OUTROS']).optional(),
        gravidade: zod_1.z.enum(['LEVE', 'MODERADA', 'GRAVE', 'GRAVISSIMA']).optional(),
        alunoId: zod_1.z.string().uuid().optional(),
        funcionarioId: zod_1.z.string().uuid().optional(),
        dataInicio: zod_1.z.string().transform((val) => new Date(val)).optional(),
        dataFim: zod_1.z.string().transform((val) => new Date(val)).optional(),
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }).optional(),
});
//# sourceMappingURL=ocorrenciaSchemas.js.map