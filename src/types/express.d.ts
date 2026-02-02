import { RoleUsuario } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        escolaId: string
        role: RoleUsuario // Usando o Enum oficial
      }
    }
  }
}