"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardFiltroSchema = void 0;
const zod_1 = require("zod");
exports.dashboardFiltroSchema = zod_1.z.object({
    query: zod_1.z.object({
        mes: zod_1.z.string().regex(/^\d+$/).transform(Number).refine(m => m >= 1 && m <= 12).optional(),
        ano: zod_1.z.string().regex(/^\d{4}$/).transform(Number).optional(),
        turmaId: zod_1.z.string().uuid().optional(),
    }),
});
//# sourceMappingURL=dashboardSchemas.js.map