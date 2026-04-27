// auth.ts refatorado
import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { AppError } from './errorHandler'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Busca o token exclusivamente no cookie HttpOnly para segurança máxima
  const token = req.cookies?.edugestao_token;

  if (!token) {
    return next(new AppError('Sessão expirada ou não encontrada. Por favor, faça login novamente.', 401));
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
    return next(new AppError('Token inválido ou sessão expirada.', 401));
  }
}