import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/prisma'
import { generateToken } from '../utils/jwt'
import { AppError } from '../middlewares/errorHandler'

export const authController = {
  /**
   * POST /auth/login
   */
  async login(req: Request, res: Response) {
    const { email, senha } = req.body;

    // AVISO DO ARQUITETO: O login é a ÚNICA rota que busca dados antes 
    // de ter o contexto da escola. Por isso, findUnique global é permitido aqui.
    const usuario = await prisma.usuario.findUnique({
      where: { email }, // Zod já garantiu que está em lowerCase
      include: { escola: true }
    });

    // Proteção contra enumeração de usuários (Time-safe concept)
    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ status: 'error', message: 'Credenciais inválidas' });
    }

    // 1. Gerar Token
    const token = generateToken({
      userId: usuario.id,
      escolaId: usuario.escolaId,
      role: usuario.role,
    });

    // 2. Injetar no Cookie Seguro (Ajustado para permitir Localhost)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('edugestao_token', token, {
      httpOnly: true,
      secure: isProduction, 
      // Em desenvolvimento localhost, 'lax' é necessário para o Chrome aceitar cookies entre portas (3000 -> 3333)
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 // 24 horas
    });

    return res.json({
      status: 'success',
      data: {
        user: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role,
          escolaId: usuario.escolaId,
        }
      }
    });
  },

  /**
   * POST /auth/logout
   * Remove o cookie HttpOnly do navegador do usuário
   */
  async logout(req: Request, res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('edugestao_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/', // OBRIGATÓRIO ser igual ao do login
    });

    return res.json({ status: 'success', message: 'Logout realizado com sucesso.' });
  },

  /**
   * GET /auth/me
   * Retorna os dados do usuário logado baseado no cookie de sessão
   */
  async me(req: Request, res: Response) {
    const userId = req.user?.userId;

    console.log("--- 🟦 DEBUG BACKEND: /auth/me ---");
    console.log("🍪 Cookies brutos na Request:", req.cookies);
    console.log("🔑 Header Authorization:", req.headers.authorization);
    console.log("👤 UserID processado pelo Middleware:", userId || "⚠️ Nenhum (Middleware falhou)");
    console.log("----------------------------------");

    if (!userId) {
      throw new AppError('Não autorizado', 401);
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        escolaId: true,
        escola: {
          select: { nome: true }
        }
      }
    });

    if (!usuario) throw new AppError('Usuário não encontrado', 404);

    return res.json({ status: 'success', data: { user: usuario } });
  },
}