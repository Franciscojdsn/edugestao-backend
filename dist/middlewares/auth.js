"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.checkRole = checkRole;
const jwt_1 = require("../utils/jwt");
const errorHandler_1 = require("./errorHandler");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        throw new errorHandler_1.AppError('Token não fornecido', 401);
    }
    const [, token] = authHeader.split(' ');
    if (!token) {
        throw new errorHandler_1.AppError('Token malformatado', 401);
    }
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = {
            userId: decoded.userId,
            escolaId: decoded.escolaId,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        throw new errorHandler_1.AppError('Token inválido', 401);
    }
}
function checkRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            throw new errorHandler_1.AppError('Acesso negado', 403);
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map