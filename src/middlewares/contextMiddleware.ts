import { Request, Response, NextFunction } from 'express'
import { requestContext } from '../utils/context'

/**
 * Middleware que injeta o contexto da requisição no AsyncLocalStorage
 * Deve ser usado DEPOIS do authMiddleware
 */
export function contextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Se tem usuário autenticado, armazena no contexto
  if (req.user) {
    requestContext.run(
      {
        escolaId: req.user.escolaId,
        userId: req.user.userId,
        role: req.user.role,
      },
      () => {
        next()
      }
    )
  } else {
    // Sem autenticação, apenas continua
    next()
  }
}
