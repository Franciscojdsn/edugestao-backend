"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listarPorTurmaSchema = exports.listarGradeTurmaSchema = exports.criarGradeSchema = void 0;
const zod_1 = require("zod");
exports.criarGradeSchema = zod_1.z.object({
    body: zod_1.z.object({
        diaSemana: zod_1.z.number().min(0).max(6, 'Dia deve ser entre 0 (Dom) e 6 (Sáb)'),
        horarioInicio: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm inválido'),
        horarioFim: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm inválido'),
        turmaDisciplinaId: zod_1.z.string().uuid('ID de vínculo inválido'),
    }),
});
exports.listarGradeTurmaSchema = zod_1.z.object({
    params: zod_1.z.object({
        turmaId: zod_1.z.string().uuid('ID de turma inválido'),
    }),
});
exports.listarPorTurmaSchema = zod_1.z.object({
    params: zod_1.z.object({
        turmaId: zod_1.z.string().uuid('ID de turma inválido'),
    }),
});
//# sourceMappingURL=gradeHorariaSchemas.js.map