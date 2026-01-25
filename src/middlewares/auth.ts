import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { AppError } from './errorHandler'

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    throw new AppError('Token não fornecido', 401)
  }

  const [, token] = authHeader.split(' ')

  if (!token) {
    throw new AppError('Token malformatado', 401)
  }

  try {
    const decoded = verifyToken(token)
    
    req.user = {
      userId: decoded.userId,
      escolaId: decoded.escolaId,
      role: decoded.role,
    }

    next()
  } catch (error) {
    throw new AppError('Token inválido', 401)
  }
}