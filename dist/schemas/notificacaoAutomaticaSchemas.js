"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumoPendenciasSchema = exports.escalonarPagamentoSchema = void 0;
const zod_1 = require("zod");
exports.escalonarPagamentoSchema = zod_1.z.object({
    params: zod_1.z.object({
        pagamentoId: zod_1.z.string().uuid(),
    }),
});
exports.resumoPendenciasSchema = zod_1.z.object({
    query: zod_1.z.object({
        alunoId: zod_1.z.string().uuid().optional(),
        turmaId: zod_1.z.string().uuid().optional(),
    }).optional(),
});
//# sourceMappingURL=notificacaoAutomaticaSchemas.js.map