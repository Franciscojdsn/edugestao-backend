"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boletimAlunoSchema = exports.listarNotasSchema = exports.atualizarNotaSchema = exports.criarNotaSchema = void 0;
const zod_1 = require("zod");
exports.criarNotaSchema = zod_1.z.object({
    body: zod_1.z.object({
        alunoId: zod_1.z.string().uuid(),
        disciplinaId: zod_1.z.string().uuid(),
        turmaId: zod_1.z.string().uuid(),
        valor: zod_1.z.number().min(0).max(10),
        bimestre: zod_1.z.number().int().min(1).max(4),
        anoLetivo: zod_1.z.number().int().min(2000).max(2100),
        observacao: zod_1.z.string().max(500).optional(),
    }),
});
exports.atualizarNotaSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        valor: zod_1.z.number().min(0).max(10).optional(),
        observacao: zod_1.z.string().max(500).optional(),
    }),
});
exports.listarNotasSchema = zod_1.z.object({
    query: zod_1.z.object({
        alunoId: zod_1.z.string().uuid().optional(),
        disciplinaId: zod_1.z.string().uuid().optional(),
        bimestre: zod_1.z.string().regex(/^[1-4]$/).transform(Number).optional(),
        anoLetivo: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }).optional(),
});
exports.boletimAlunoSchema = zod_1.z.object({
    params: zod_1.z.object({
        alunoId: zod_1.z.string().uuid(),
    }),
    query: zod_1.z.object({
        anoLetivo: zod_1.z.string().regex(/^\d+$/).transform(Number),
    }),
});
//# sourceMappingURL=notaSchemas.js.map