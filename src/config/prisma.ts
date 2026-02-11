import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import { requestContext } from '../utils/context'
import { logAction } from '../utils/logAuditoria'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

const prismaBase = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
})

export const prisma = prismaBase.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        // 1. Executa a query original primeiro
        const result = await query(args)

        // 2. Define operações auditáveis
        const acoesEscrita = ['create', 'update', 'delete', 'upsert', 'updateMany', 'deleteMany']

        // Evita loop infinito no próprio log
        if (model === 'LogAuditoria') return result

        if (acoesEscrita.includes(operation)) {
          // Pega o contexto
          const context = requestContext.getStore()

          // Tenta achar ID da escola no contexto ou nos dados da query
          const argsData = (args as any)
          const escolaId = context?.escolaId || argsData?.data?.escolaId || argsData?.where?.escolaId

          // Só audita se tiver escolaId (obrigatório no seu sistema)
          if (escolaId) {
            // Prepara IDs
            let entidadeId = 'SISTEMA/LOTE'
            if (result && typeof result === 'object' && 'id' in result) {
              entidadeId = String((result as any).id)
            } else if (argsData?.where?.id) {
              entidadeId = String(argsData.where.id)
            }

            // Dispara auditoria em background (sem await)
            logAction({
              entidade: model,
              entidadeId,
              acao: operation.toUpperCase() as any,
              dadosNovos: argsData?.data || null,
              dadosAntigos: argsData?.where || null,
              usuarioId: context?.userId, // Manda o que tiver, o logAction trata se falhar
              escolaId: escolaId,
              ip: 'API'
            })
          }
        }
        return result
      }
    }
  }
})

// Encerramento gracioso
process.on('SIGINT', async () => {
  await prismaBase.$disconnect()
  await pool.end()
  process.exit(0)
})