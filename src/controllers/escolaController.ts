import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'

export const escolaController = {
  // GET /escolas - Listar todas
  async list(req: Request, res: Response) {
    const escolas = await prisma.escola.findMany({
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

    return res.json(escolas)
  },

  // GET /escolas/:id - Detalhe
  async show(req: Request, res: Response) {
    const { id } = req.params

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
