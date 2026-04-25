"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestContext = void 0;
exports.getContext = getContext;
exports.getEscolaId = getEscolaId;
exports.getUserId = getUserId;
const async_hooks_1 = require("async_hooks");
// AsyncLocalStorage para armazenar contexto da requisição
exports.requestContext = new async_hooks_1.AsyncLocalStorage();
/**
 * Pega o contexto da requisição atual
 */
function getContext() {
    return exports.requestContext.getStore() || {};
}
/**
 * Pega o escolaId da requisição atual
 */
function getEscolaId() {
    return getContext().escolaId;
}
/**
 * Pega o userId da requisição atual
 */
function getUserId() {
    return getContext().userId;
}
//# sourceMappingURL=context.js.map