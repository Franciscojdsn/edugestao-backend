// Refatoração do prisma.ts para Multi-tenancy Automático
import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger';
import { requestContext } from '../utils/context'

const prismaBase = new PrismaClient()

export const prisma = prismaBase.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const context = requestContext.getStore();
        const escolaId = context?.escolaId;

        // Tabelas que NÃO possuem escolaId (Exceções do Sistema)
        const publicModels = ['Escola', 'LogAuditoria'];
        const isPublicModel = publicModels.includes(model);

        // 1. SEGURANÇA MÁXIMA: Impede escrita sem Tenant identificado
        const writeOps = ['create', 'update', 'delete', 'upsert', 'updateMany', 'deleteMany'];
        if (writeOps.includes(operation) && !escolaId && !isPublicModel) {
          const errorMsg = `Tentativa de escrita bloqueada: ${operation} em ${model} sem escolaId.`;

          // ALERTA EM TEMPO REAL
          await logger.critical(errorMsg, {
            model,
            operation,
            userId: context?.userId,
            args: (args as any).where || (args as any).data
          });

          throw new Error(`[CRITICAL SECURITY] ${errorMsg}`);
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
          // Filtro Global
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