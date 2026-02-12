import { Request, Response, NextFunction } from 'express'
import { ZodObject } from 'zod'

/**
 * Middleware para validar dados com Zod
 */
export function validate(schema: ZodObject<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("DEBUG: Validando dados do corpo:", req.body); // ADICIONE ISSO
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      console.log("DEBUG: Erro de validação Zod!", error); // ADICIONE ISSO
      next(error);
    }
  };
}

/**
 * Middleware simplificado para validar só o body
 */
export function validateBody(schema: ZodObject<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body)
      next()
    } catch (error) {
      next(error)
    }
  }
}