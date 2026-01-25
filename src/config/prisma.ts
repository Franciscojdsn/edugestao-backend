import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// Configuração do Pool PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

// Criar cliente Prisma (SEM middleware - Prisma 7 não suporta mais $use)
export const prisma = new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error']
})

// Shutdown gracioso
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  await pool.end()
  process.exit(0)
})