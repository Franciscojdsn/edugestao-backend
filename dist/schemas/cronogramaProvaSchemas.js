"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portalResponsavelSchema = exports.copiarCronogramaSchema = exports.criarCronogramaSchema = void 0;
const zod_1 = require("zod");
exports.criarCronogramaSchema = zod_1.z.object({
    body: zod_1.z.object({
        turmaId: zod_1.z.string().uuid('ID de turma inválido'),
        disciplinasPorDia: zod_1.z.array(zod_1.z.object({
            data: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data deve ser AAAA-MM-DD'),
            disciplinaId: zod_1.z.string().uuid('ID de disciplina inválido'),
            ordem: zod_1.z.number().int().min(1).default(1)
        })).min(1, 'É necessário informar ao menos uma prova')
    })
});
exports.copiarCronogramaSchema = zod_1.z.object({
    body: zod_1.z.object({
        turmaOrigemId: zod_1.z.string().uuid(),
        turmasDestinoIds: zod_1.z.array(zod_1.z.string().uuid()).min(1),
        dataInicio: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        dataFim: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    })
});
exports.portalResponsavelSchema = zod_1.z.object({
    params: zod_1.z.object({
        turmaId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({
        dataInicio: zod_1.z.string().optional(),
        dataFim: zod_1.z.string().optional()
    })
});
//# sourceMappingURL=cronogramaProvaSchemas.js.map