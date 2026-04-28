import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { logger } from '../utils/logger'; // Certifique-se de que este caminho está correto
import { getEscolaId, requestContext } from '../utils/context'; // Certifique-se de que este caminho está correto

// 1. Usamos a DATABASE_URL (com PgBouncer) para alta concorrência em produção
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("❌ [CRITICAL] DATABASE_URL não encontrada. O arquivo .env não foi carregado corretamente.");
}

// 2. Configurar o Pool de conexão nativo do PG
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

// 3. Criar o Adapter
const adapter = new PrismaPg(pool);

// 4. Inicializar o Prisma passando o Adapter
const prismaBase = new PrismaClient({ adapter });

// 5. Extensões e Middlewares de Segurança (Multi-tenant e Auditoria)
export const prisma = prismaBase.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const escolaId = getEscolaId();
        const context = requestContext.getStore();

        // Tabelas que NÃO possuem escolaId (Exceções do Sistema)
        const publicModels = ['Escola', 'LogAuditoria'];
        const isPublicModel = publicModels.includes(model);

        const writeOps = ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany'];
        const isAuthOperation = model === 'Funcionario' || model === 'Responsavel' || model === 'Aluno';

        // Validação de Segurança Crítica: Tentativa de escrita global sem escolaId
        if (!isPublicModel && !escolaId && writeOps.includes(operation) && !isAuthOperation) {
          const errorMsg = `Tentativa de escrita global não permitida: ${operation} em ${model} sem escolaId.`;

          await logger.critical(errorMsg, {
            model,
            operation,
            userId: context?.userId,
            args: (args as any).where || (args as any).data
          });

          throw new Error(`[CRITICAL SECURITY] ${errorMsg}`);
        }

        // Se for um modelo global, executa sem injetar escolaId
        if (isPublicModel) {
          return query(args);
        }

        // Injeção de Segurança para Multi-tenancy
        if (escolaId) {
          // Filtro Global de Multi-tenancy (Adiciona escolaId ao WHERE)
          if ('where' in args) {
            args.where = { ...args.where, escolaId };
          }

          // Soft Delete Automático para Alunos (Não traz alunos deletados nas buscas)
          if (model === 'Aluno' && 'where' in args) {
            args.where = { ...args.where, deletedAt: null };
          }

          // Auto-injeção no Create (Garante que todo registro nasce no tenant certo)
          if (operation === 'create' && args.data) {
            (args.data as any).escolaId = escolaId;
          }
          if (operation === 'createMany' && Array.isArray(args.data)) {
            (args as any).data = args.data.map(item => ({ ...item, escolaId }));
          }
        }

        // Executa a Query Real
        const result = await query(args);

        // Auditoria pós-execução para operações de escrita
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

        return result;
      }
    }
  }
});