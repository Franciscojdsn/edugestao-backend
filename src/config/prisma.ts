// src/config/prisma.ts
import { PrismaClient } from '@prisma/client';
import { requestContext } from '../utils/context';

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const store = requestContext.getStore();
        const escolaId = store?.escolaId;

        // Se não houver escolaId no contexto (ex: rotas públicas de login/seed), executa normalmente
        // Ignora também o próprio modelo de Escola para evitar loops lógicos
        if (!escolaId || model === 'Escola') {
          return query(args);
        }

        const anyArgs = args as any;

        // 1. Injeção forçada de filtro em operações de leitura e mutação direcionada
        if ([
          'findFirst', 'findFirstOrThrow', 'findMany', 'count', 
          'update', 'updateMany', 'delete', 'deleteMany', 'upsert'
        ].includes(operation)) {
          anyArgs.where = {
            ...anyArgs.where,
            escolaId,
            // Evita bypass via soft delete implicitamente se implementado globalmente
            deletedAt: null 
          };
        }

        // 2. Injeção forçada de propriedade na criação de registros
        if (operation === 'create') {
          anyArgs.data = {
            ...anyArgs.data,
            escolaId
          };
        }

        if (operation === 'createMany') {
          if (Array.isArray(anyArgs.data)) {
            anyArgs.data = anyArgs.data.map((item: any) => ({
              ...item,
              escolaId
            }));
          } else if (anyArgs.data) {
            anyArgs.data = { ...anyArgs.data, escolaId };
          }
        }

        return query(anyArgs);
      }
    }
  }
});