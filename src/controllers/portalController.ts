import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withTenancy } from '../utils/prismaHelpers'

export const portalController = {
    /**
     * GET /portal/dashboard - Retorna dados do responsável e seus filhos
     */
    async getDashboard(req: Request, res: Response) {
        // O ID do usuário logado vem do authMiddleware (req.user.userId)
        const userId = req.user?.userId

        if (!userId) {
            throw new AppError('Usuário não identificado', 401)
        }

        // Busca o usuário e inclui os dados de responsável e alunos vinculados
        // Usamos withTenancy para garantir que ele só veja dados da escola dele
        const dados = await prisma.usuario.findFirst({
            where: withTenancy({ id: userId }),
            include: {
                escola: true
            }
        })

        if (!dados) {
            throw new AppError('Dados não encontrados', 404)
        }

        return res.json(dados)
    }
}