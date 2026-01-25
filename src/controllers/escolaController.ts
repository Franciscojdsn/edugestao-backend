import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'

export const escolaController = {
  // GET /escolas - Listar todas
  async list(req: Request, res: Response) {
    // ⚠️ ESCOLA NÃO TEM escolaId! 
    // Usuário só consegue ver a própria escola baseado no JWT
    const escolaId = req.user?.escolaId

    if (!escolaId) {
      throw new AppError('Usuário não autenticado', 401)
    }

    // Retorna apenas a escola do usuário
    const escola = await prisma.escola.findUnique({
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
    })

    if (!escola) {
      throw new AppError('Escola não encontrada', 404)
    }

    // Retorna array com 1 escola (compatível com frontend)
    return res.json([escola])
  },

  // GET /escolas/:id - Detalhe
  async show(req: Request, res: Response) {
    const { id } = req.params
    const escolaId = req.user?.escolaId

    // Verifica se o ID solicitado é da escola do usuário
    if (id !== escolaId) {
      throw new AppError('Acesso negado', 403)
    }

    const escola = await prisma.escola.findUnique({
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
    })

    if (!escola) {
      throw new AppError('Escola não encontrada', 404)
    }

    return res.json(escola)
  },
}