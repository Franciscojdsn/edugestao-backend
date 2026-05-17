import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middlewares/errorHandler';

export const authController = {
  /**
   * POST /auth/login
   */
  async login(req: Request, res: Response) {
    const { email, senha } = req.body;

    // AVISO: O login ocorre fora do escopo Tenant por design. Prisma Extension ignorará o tenant se não estiver no context
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ status: 'error', message: 'Credenciais inválidas' });
    }

    const token = generateToken({
      userId: usuario.id,
      escolaId: usuario.escolaId,
      role: usuario.role,
    });

    const isProduction = process.env.NODE_ENV === 'production';
    
    // Transporte Blindado (O token não desce no JSON)
    res.cookie('edugestao_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict', // Impede CSRF 
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
      path: '/',
    });

    return res.status(200).json({
      status: 'success',
      user: {
        id: usuario.id,
        nome: usuario.nome,
        role: usuario.role,
        escolaId: usuario.escolaId
      }
    });
  },

  /**
   * POST /auth/logout
   */
  async logout(req: Request, res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Purga a sessão do navegador
    res.clearCookie('edugestao_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
    });

    return res.status(200).json({ status: 'success', message: 'Logout processado.' });
  },

  /**
   * GET /auth/me
   */
  async me(req: Request, res: Response) {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Não autorizado. Token inexistente ou expirado.', 401);
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        escolaId: true
      }
    });

    if (!usuario) {
      throw new AppError('Usuário não localizado no diretório.', 404);
    }

    return res.status(200).json({ status: 'success', user: usuario });
  }
};