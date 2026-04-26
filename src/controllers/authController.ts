// authController.ts refatorado
import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/prisma'
import { generateToken } from '../utils/jwt'

export const authController = {
  async login(req: Request, res: Response) {
    const { email, senha } = req.body;

    try {
      const usuario = await prisma.usuario.findUnique({
        where: { email: email.trim().toLowerCase() },
        include: { escola: true } // Validar status da escola
      });

      if (!usuario || !(await bcrypt.compare(senha.trim(), usuario.senha))) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      // 1. Gerar Token
      const token = generateToken({
        userId: usuario.id,
        escolaId: usuario.escolaId,
        role: usuario.role,
      });

      // 2. Injetar no Cookie Seguro
      res.cookie('edugestao_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Apenas HTTPS em prod
        sameSite: 'strict', // Previne CSRF
        maxAge: 1000 * 60 * 60 * 24 // 24 horas
      });

      // 3. Retornar apenas dados não sensíveis
      return res.json({
        user: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role,
          escolaId: usuario.escolaId
        }
      });
    } catch (error) {
      console.error("[AUTH_ERROR]", error);
      return res.status(500).json({ message: 'Erro interno no servidor' });
    }
  },

  async logout(req: Request, res: Response) {
    res.clearCookie('edugestao_token');
    return res.status(204).send();
  }
}