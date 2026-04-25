"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portalFiltroSchema = exports.portalBaseSchema = void 0;
const zod_1 = require("zod");
exports.portalBaseSchema = zod_1.z.object({
    query: zod_1.z.object({
        responsavelId: zod_1.z.string().uuid('ID do responsável inválido'),
    }),
});
exports.portalFiltroSchema = zod_1.z.object({
    query: zod_1.z.object({
        responsavelId: zod_1.z.string().uuid('ID do responsável inválido'),
        anoLetivo: zod_1.z.string().regex(/^\d{4}$/).transform(Number).optional(),
        status: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=portalResponsavelSchemas.js.map