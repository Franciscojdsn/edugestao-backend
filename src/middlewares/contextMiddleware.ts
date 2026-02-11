import { Request, Response, NextFunction } from 'express'
import { requestContext } from '../utils/context'

export function contextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.user) {
    // Normalização defensiva: tenta pegar userId OU id
    const idDoUsuario = req.user.userId || (req.user as any).id;

    requestContext.run(
      {
        escolaId: req.user.escolaId,
        userId: idDoUsuario, // Agora garantimos que não vai undefined
        role: req.user.role,
      },
      () => {
        next()
      }
    )
  } else {
    next()
  }
}