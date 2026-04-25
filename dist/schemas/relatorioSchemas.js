"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relatorioFrequenciaSchema = exports.relatorioPedagogicoSchema = exports.relatorioFinanceiroSchema = void 0;
const zod_1 = require("zod");
exports.relatorioFinanceiroSchema = zod_1.z.object({
    query: zod_1.z.object({
        mes: zod_1.z.string().regex(/^\d{1,2}$/).transform(Number).optional(),
        ano: zod_1.z.string().regex(/^\d{4}$/).transform(Number).optional(),
    }).optional(),
});
exports.relatorioPedagogicoSchema = zod_1.z.object({
    query: zod_1.z.object({
        turmaId: zod_1.z.string().uuid().optional(),
        anoLetivo: zod_1.z.string().regex(/^\d{4}$/).transform(Number).optional(),
    }).optional(),
});
exports.relatorioFrequenciaSchema = zod_1.z.object({
    query: zod_1.z.object({
        anoLetivo: zod_1.z.string().regex(/^\d{4}$/).transform(Number).optional(),
    }).optional(),
});
//# sourceMappingURL=relatorioSchemas.js.map