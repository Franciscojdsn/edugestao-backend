import * as dotenv from 'dotenv';
dotenv.config();

// Refatoração do prisma.ts para Prisma 7+ com PG Adapter


import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { logger } from '../utils/logger';
import { getEscolaId, requestContext } from '../utils/context';

// 1. Verificar se a variável de ambiente DATABASE_URL está presente
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("❌ [CRITICAL] DATABASE_URL não encontrada. O arquivo .env não foi carregado corretamente.");
}
 
// 1. Configurar o Pool de conexão do PG
const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});

// 2. Criar o Adapter
const adapter = new PrismaPg(pool);

// 3. Inicializar o Prisma passando o Adapter
const prismaBase = new PrismaClient({ adapter });

export const prisma = prismaBase.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const escolaId = getEscolaId();
        const context = requestContext.getStore();

        // Tabelas que NÃO possuem escolaId (Exceções do Sistema)
        const publicModels = ['Escola', 'LogAuditoria'];
        const isPublicModel = publicModels.includes(model);
        
        // Usuário é um caso especial: isolado por escola, mas acessível globalmente via email no login
        const isAuthOperation = model === 'Usuario' && !escolaId;

        const writeOps = ['create', 'update', 'delete', 'upsert', 'updateMany', 'deleteMany'];
        if (writeOps.includes(operation) && !escolaId && !isPublicModel && model !== 'Usuario') {
          const errorMsg = `Tentativa de escrita bloqueada: ${operation} em ${model} sem escolaId.`;

          await logger.critical(errorMsg, {
            model,
            operation,
            userId: context?.userId,
            args: (args as any).where || (args as any).data
          });

          throw new Error(`[CRITICAL SECURITY] ${errorMsg}`);
        }

        // Se for um modelo global ou operação de login, executa sem filtros
        if (isPublicModel || isAuthOperation) {
          return query(args);
        }

        const result = await query(args);

        if (writeOps.includes(operation) && escolaId && !isPublicModel) {
          logger.audit({
            entidade: model,
            acao: operation.toUpperCase(),
            entidadeId: (result as any)?.id || 'N/A',
            escolaId,
            usuarioId: context?.userId,
            dadosNovos: (args as any).data
          });
        }

        if (escolaId && !isPublicModel) {
          // Filtro Global de Multi-tenancy
          if ('where' in args) args.where = { ...args.where, escolaId };

          // Soft Delete Automático para Alunos
          if (model === 'Aluno' && 'where' in args) {
            args.where = { ...args.where, deletedAt: null };
          }

          // Auto-injeção no Create
          if (operation === 'create' && 'data' in args) {
            args.data = { ...args.data, escolaId: escolaId as any };
          }
        }

        return query(args);
      }
    }
  }
});