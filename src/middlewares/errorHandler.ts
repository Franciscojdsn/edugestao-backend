import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client' // Importação correta para tipos de erro
import { ZodError } from 'zod'

export class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
    // Mantém o protótipo correto em classes que estendem Error
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function errorHandler(
  err: unknown, // Usamos unknown para segurança de tipos
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // 1. Erro customizado (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    })
  }

  // 2. Erro de validação Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Erro de validação',
      // 'issues' é o nome oficial da propriedade no tipo ZodError
      errors: err.issues, 
    })
  }


  // 3. Erro do Prisma (Banco de dados)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint (P2002)
    if (err.code === 'P2002') {
      return res.status(400).json({
        status: 'error',
        message: 'Já existe um registro com esses dados',
      })
    }

    // Not found (P2025)
    if (err.code === 'P2025') {
      return res.status(404).json({
        status: 'error',
        message: 'Registro não encontrado',
      })
    }
  }

  // 4. Erro genérico/desconhecido
  const message = err instanceof Error ? err.message : 'Erro interno do servidor'
  console.error(' [ERROR LOG]:', err)

  return res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor',
  })
}
