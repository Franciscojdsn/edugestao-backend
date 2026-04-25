"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withEscolaId = withEscolaId;
exports.withoutDeleted = withoutDeleted;
exports.withTenancy = withTenancy;
const context_1 = require("./context");
/**
 * Adiciona escolaId automaticamente no where
 */
function withEscolaId(where) {
    const escolaId = (0, context_1.getEscolaId)();
    if (!escolaId) {
        return (where || {});
    }
    // O segredo está em converter para 'any' primeiro para evitar o erro de overlap
    return {
        ...where,
        escolaId,
    };
}
/**
 * Adiciona deletedAt: null automaticamente (soft delete)
 */
function withoutDeleted(where) {
    return {
        ...where,
        deletedAt: null,
    };
}
/**
 * Combina escolaId + deletedAt
 */
function withTenancy(where) {
    // Como as funções acima já retornam T, o encadeamento funciona
    return withoutDeleted(withEscolaId(where));
}
//# sourceMappingURL=prismaHelpers.js.map