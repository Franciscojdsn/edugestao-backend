"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escolaController = void 0;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middlewares/errorHandler");
exports.escolaController = {
    // GET /escolas - Listar todas
    async list(req, res) {
        // ⚠️ ESCOLA NÃO TEM escolaId! 
        // Usuário só consegue ver a própria escola baseado no JWT
        const escolaId = req.user?.escolaId;
        if (!escolaId) {
            throw new errorHandler_1.AppError('Usuário não autenticado', 401);
        }
        // Retorna apenas a escola do usuário
        const escola = await prisma_1.prisma.escola.findUnique({
            where: { id: escolaId },
            select: {
                id: true,
                nome: true,
                cnpj: true,
                telefone: true,
                email: true,
                mensalidadePadrao: true,
                diaVencimento: true,
                createdAt: true,
            },
        });
        if (!escola) {
            throw new errorHandler_1.AppError('Escola não encontrada', 404);
        }
        // Retorna array com 1 escola (compatível com frontend)
        return res.json([escola]);
    },
    // GET /escolas/:id - Detalhe
    async show(req, res) {
        const { id } = req.params;
        const escolaId = req.user?.escolaId;
        // Verifica se o ID solicitado é da escola do usuário
        if (id !== escolaId) {
            throw new errorHandler_1.AppError('Acesso negado', 403);
        }
        const escola = await prisma_1.prisma.escola.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        alunos: true,
                        funcionarios: true,
                        turmas: true,
                        usuarios: true,
                    },
                },
            },
        });
        if (!escola) {
            throw new errorHandler_1.AppError('Escola não encontrada', 404);
        }
        return res.json(escola);
    },
};
//# sourceMappingURL=escolaController.js.map