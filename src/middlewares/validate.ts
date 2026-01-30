import { Request, Response, NextFunction } from 'express'
import { ZodObject } from 'zod'

/**
 * Middleware para validar dados com Zod
 */
export function validate(schema: ZodObject<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Valida body, query e params
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })

      // NÃO tenta sobrescrever req.query (é read-only)
      // A validação já aconteceu, isso é suficiente
      next()
    } catch (error) {
      next(error)
    }
  }
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