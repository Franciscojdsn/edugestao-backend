import { Request, Response } from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { prisma } from '../config/prisma'
import { generateToken } from '../utils/jwt'
import { AppError } from '../middlewares/errorHandler'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
})

export const authController = {
  async login(req: Request, res: Response) {
    // Validar dados
    const { email, senha } = loginSchema.parse(req.body)

    // Buscar usuário
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { escola: true },
    })

    if (!usuario) {
      throw new AppError('Email ou senha incorretos', 401)
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha)

    if (!senhaValida) {
      throw new AppError('Email ou senha incorretos', 401)
    }

    // Gerar token
    const token = generateToken({
      userId: usuario.id,
      escolaId: usuario.escolaId,
      role: usuario.role,
    })

    // Retornar dados (sem senha)
    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        escola: {
          id: usuario.escola.id,
          nome: usuario.escola.nome,
        },
      },
    })
  },
}