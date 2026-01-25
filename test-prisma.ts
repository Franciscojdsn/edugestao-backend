// Verificar qual engine type está configurado
import { PrismaClient } from '@prisma/client'

console.log('\n--- Informações do Prisma ---')
try {
  const prisma = new PrismaClient({ 
    adapter: null as any // Força passar algo
  })
  console.log('Prisma:', prisma)
} catch (e: any) {
  console.log('Erro completo:', e)
  console.log('\nMensagem:', e.message)
}