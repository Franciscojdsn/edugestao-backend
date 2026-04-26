import { Request, Response, NextFunction } from 'express';
import { requestContext } from '../utils/context';

export function contextMiddleware(req: Request, res: Response, next: NextFunction) {
  // Pega os dados que o authMiddleware injetou no req.user
  const user = req.user;

  if (!user || !user.escolaId) {
    // Se a rota for pública, segue sem contexto. 
    // Se for privada, o authMiddleware já teria barrado antes.
    return next();
  }

  // Cria a "bolha" de isolamento para esta requisição específica
  requestContext.run({ 
    escolaId: user.escolaId, 
    userId: user.userId, 
    role: user.role 
  }, () => {
    next();
  });
}