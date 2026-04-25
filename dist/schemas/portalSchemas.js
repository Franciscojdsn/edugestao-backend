"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortalDadosSchema = void 0;
const zod_1 = require("zod");
exports.getPortalDadosSchema = zod_1.z.object({
    // Como o ID vem do Token (req.user), não precisamos de corpo ou query obrigatória aqui,
    // mas deixamos o objeto para seguir o padrão do middleware validate()
    query: zod_1.z.object({}).optional()
});
//# sourceMappingURL=portalSchemas.js.map