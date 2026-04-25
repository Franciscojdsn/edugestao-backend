"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relatorioFrequenciaSchema = exports.listarFrequenciaSchema = exports.registrarChamadaSchema = void 0;
const zod_1 = require("zod");
exports.registrarChamadaSchema = zod_1.z.object({
    body: zod_1.z.object({
        turmaId: zod_1.z.string().uuid(),
        disciplinaId: zod_1.z.string().uuid().optional(),
        data: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        presencas: zod_1.z.array(zod_1.z.object({
            alunoId: zod_1.z.string().uuid(),
            presente: zod_1.z.boolean(),
            justificativa: zod_1.z.string().optional(),
        })).min(1),
    }),
});
exports.listarFrequenciaSchema = zod_1.z.object({
    query: zod_1.z.object({
        turmaId: zod_1.z.string().uuid().optional(),
        alunoId: zod_1.z.string().uuid().optional(),
        dataInicio: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        dataFim: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }).optional(),
});
exports.relatorioFrequenciaSchema = zod_1.z.object({
    params: zod_1.z.object({
        alunoId: zod_1.z.string().uuid(),
    }),
    query: zod_1.z.object({
        mesInicio: zod_1.z.string().regex(/^\d{4}-\d{2}$/).optional(),
        mesFim: zod_1.z.string().regex(/^\d{4}-\d{2}$/).optional(),
    }).optional(),
});
//# sourceMappingURL=frequenciaSchemas.js.map