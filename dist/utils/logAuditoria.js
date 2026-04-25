"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = logAction;
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
async function logAction(params, dbClient = prisma_1.prisma) {
    try {
        await dbClient.logAuditoria.create({
            data: {
                entidade: params.entidade,
                entidadeId: params.entidadeId,
                acao: params.acao,
                escolaId: params.escolaId,
                ip: params.ip || null,
                usuarioId: params.usuarioId || null,
                dadosAntigos: params.dadosAntigos ?? client_1.Prisma.DbNull,
                dadosNovos: params.dadosNovos ?? client_1.Prisma.DbNull,
            },
        });
    }
    catch (error) {
        console.error('[LOG AUDITORIA] Erro:', error);
    }
}
//# sourceMappingURL=logAuditoria.js.map