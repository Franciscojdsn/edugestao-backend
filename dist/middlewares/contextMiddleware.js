"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextMiddleware = contextMiddleware;
const context_1 = require("../utils/context");
function contextMiddleware(req, res, next) {
    if (req.user) {
        // Normalização defensiva: tenta pegar userId OU id
        const idDoUsuario = req.user.userId || req.user.id;
        context_1.requestContext.run({
            escolaId: req.user.escolaId,
            userId: idDoUsuario, // Agora garantimos que não vai undefined
            role: req.user.role,
        }, () => {
            next();
        });
    }
    else {
        next();
    }
}
//# sourceMappingURL=contextMiddleware.js.map