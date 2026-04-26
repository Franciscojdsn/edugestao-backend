// auth.ts refatorado
import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { AppError } from './errorHandler'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Busca o token no cookie (requer o pacote 'cookie-parser' no server.ts)
  const token = req.cookies.edugestao_token;

  if (!token) {
    throw new AppError('Sessão expirada ou não encontrada', 401);
  }

  try {
    const decoded = verifyToken(token) as any;
    
    req.user = {
      userId: decoded.userId,
      escolaId: decoded.escolaId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    throw new AppError('Token inválido', 401);
  }
}