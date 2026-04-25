"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listarEventosSchema = exports.atualizarEventoSchema = exports.criarEventoSchema = void 0;
const zod_1 = require("zod");
exports.criarEventoSchema = zod_1.z.object({
    body: zod_1.z.object({
        titulo: zod_1.z.string().min(3).max(200),
        descricao: zod_1.z.string().optional(),
        tipo: zod_1.z.enum(['AULA', 'PROVA', 'REUNIAO', 'FERIADO', 'EVENTO_ESCOLAR', 'RECESSO', 'FERIAS', 'OUTROS']),
        dataInicio: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        dataFim: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        horaInicio: zod_1.z.string().regex(/^\d{2}:\d{2}$/).optional(),
        horaFim: zod_1.z.string().regex(/^\d{2}:\d{2}$/).optional(),
        diaLetivo: zod_1.z.boolean().default(true),
        publico: zod_1.z.boolean().default(true),
        turmaId: zod_1.z.string().uuid().optional(),
    }),
});
exports.atualizarEventoSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        titulo: zod_1.z.string().min(3).max(200).optional(),
        descricao: zod_1.z.string().optional(),
        tipo: zod_1.z.enum(['AULA', 'PROVA', 'REUNIAO', 'FERIADO', 'EVENTO_ESCOLAR', 'RECESSO', 'FERIAS', 'OUTROS']).optional(),
        dataInicio: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        dataFim: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        horaInicio: zod_1.z.string().regex(/^\d{2}:\d{2}$/).optional(),
        horaFim: zod_1.z.string().regex(/^\d{2}:\d{2}$/).optional(),
        diaLetivo: zod_1.z.boolean().optional(),
        publico: zod_1.z.boolean().optional(),
        turmaId: zod_1.z.string().uuid().optional(),
    }),
});
exports.listarEventosSchema = zod_1.z.object({
    query: zod_1.z.object({
        tipo: zod_1.z.enum(['AULA', 'PROVA', 'REUNIAO', 'FERIADO', 'EVENTO_ESCOLAR', 'RECESSO', 'FERIAS', 'OUTROS']).optional(),
        turmaId: zod_1.z.string().uuid().optional(),
        dataInicio: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        dataFim: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        publico: zod_1.z.string().regex(/^(true|false)$/).transform(val => val === 'true').optional(),
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }).optional(),
});
//# sourceMappingURL=eventoSchemas.js.map