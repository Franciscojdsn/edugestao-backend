import jwt, { SignOptions } from 'jsonwebtoken'
import dotenv from 'dotenv'

// ⭐ CARREGAR .env
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-INSEGURO'
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn']

// Validação
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET não configurado no .env! Usando valor inseguro!')
}

interface TokenPayload {
  userId: string
  escolaId: string
  role: string
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch (error) {
    throw new Error('Token inválido ou expirado')
  }
}