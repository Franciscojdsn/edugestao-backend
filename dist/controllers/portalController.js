"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portalController = void 0;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middlewares/errorHandler");
const prismaHelpers_1 = require("../utils/prismaHelpers");
exports.portalController = {
    /**
     * GET /portal/dashboard - Retorna dados do responsável e seus filhos
     */
    async getDashboard(req, res) {
        // O ID do usuário logado vem do authMiddleware (req.user.userId)
        const userId = req.user?.userId;
        if (!userId) {
            throw new errorHandler_1.AppError('Usuário não identificado', 401);
        }
        // Busca o usuário e inclui os dados de responsável e alunos vinculados
        // Usamos withTenancy para garantir que ele só veja dados da escola dele
        const dados = await prisma_1.prisma.usuario.findFirst({
            where: (0, prismaHelpers_1.withTenancy)({ id: userId }),
            include: {
                escola: true
            }
        });
        if (!dados) {
            throw new errorHandler_1.AppError('Dados não encontrados', 404);
        }
        return res.json(dados);
    }
};
//# sourceMappingURL=portalController.js.map