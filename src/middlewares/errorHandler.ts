import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { logger } from '../utils/logger' // Importe o seu logger

export class AppError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // 1. Erro customizado (AppError - Erros de negócio)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    })
  }

  // 2. Erro de validação Zod (Entradas inválidas)
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Erro de validação nos dados enviados.',
      errors: err.issues, 
    })
  }

  // 3. Erro do Prisma (Banco de dados)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Erro de Unicidade (P2002) - Não precisa de alerta crítico, é erro de usuário
    if (err.code === 'P2002') {
      return res.status(400).json({
        status: 'error',
        message: 'Já existe um registro com esses dados (conflito de duplicidade).',
      })
    }

    // Outros erros de banco podem ser críticos (ex: queda de conexão com o Neon)
    logger.critical(`Erro de Banco de Dados (Prisma): ${err.code}`, {
      code: err.code,
      meta: err.meta,
      path: req.path
    });

    return res.status(500).json({
      status: 'error',
      message: 'Erro de integridade no banco de dados.',
    })
  }

  // 4. ERRO CRÍTICO DESCONHECIDO (500)
  // Se chegou aqui, é algo que não previmos (Bug, Crash, Memória, etc.)
  const errorMessage = err instanceof Error ? err.message : 'Erro interno não identificado';
  
  // DISPARA ALERTA NO SLACK IMEDIATAMENTE
  logger.critical(`UNHANDLED EXCEPTION: ${errorMessage}`, {
    method: req.method,
    url: req.originalUrl,
    body: req.body, // Cuidado: No futuro, filtre campos sensíveis como 'senha'
    stack: err instanceof Error ? err.stack : null
  });

  return res.status(500).json({
    status: 'error',
    message: 'Ocorreu um erro interno no servidor. Nossa equipe técnica foi notificada.',
  })
}