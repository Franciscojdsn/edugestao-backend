"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listarDisciplinasTurmaSchema = exports.desvincularDisciplinaSchema = exports.vincularDisciplinaSchema = void 0;
const zod_1 = require("zod");
exports.vincularDisciplinaSchema = zod_1.z.object({
    params: zod_1.z.object({
        turmaId: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        disciplinaId: zod_1.z.string().uuid(),
    }),
});
exports.desvincularDisciplinaSchema = zod_1.z.object({
    params: zod_1.z.object({
        turmaId: zod_1.z.string().uuid(),
        disciplinaId: zod_1.z.string().uuid(),
    }),
});
exports.listarDisciplinasTurmaSchema = zod_1.z.object({
    params: zod_1.z.object({
        turmaId: zod_1.z.string().uuid(),
    }),
});
//# sourceMappingURL=turmaDisciplinasSchemas.js.map