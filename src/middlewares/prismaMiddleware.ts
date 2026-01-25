import { Prisma } from '@prisma/client'

// Tabelas que têm escolaId (multi-tenancy)
const TABELAS_COM_ESCOLA_ID = [
  'escola',
  'usuario',
  'aluno',
  'funcionario',
  'turma',
  'disciplina',
  'transacao',
  'atividadeExtra',
]

// Tabelas que têm soft delete (deletedAt)
const TABELAS_COM_SOFT_DELETE = [
  'aluno',
  'funcionario',
  'transacao',
]

/**
 * Cria middleware do Prisma para multi-tenancy e soft delete
 * @param escolaId - ID da escola do usuário autenticado
 */
export function createPrismaMiddleware(escolaId?: string) {
  return async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<any>
  ) => {
    const { model, action } = params

    if (!model) return next(params)

    const modelName = model.toLowerCase()

    // ============================================
    // 1. MULTI-TENANCY - Injetar escolaId
    // ============================================
    if (escolaId && TABELAS_COM_ESCOLA_ID.includes(modelName)) {
      // Operações que precisam de filtro
      if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'].includes(action)) {
        params.args.where = {
          ...params.args.where,
          escolaId,
        }
      }

      // Create/Update - adiciona escolaId automaticamente
      if (action === 'create') {
        params.args.data = {
          ...params.args.data,
          escolaId,
        }
      }

      // UpdateMany/DeleteMany - filtra por escolaId
      if (['updateMany', 'deleteMany'].includes(action)) {
        params.args.where = {
          ...params.args.where,
          escolaId,
        }
      }
    }

    // ============================================
    // 2. SOFT DELETE - Filtrar deletedAt
    // ============================================
    if (TABELAS_COM_SOFT_DELETE.includes(modelName)) {
      // Queries - filtra deletedAt IS NULL
      if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'].includes(action)) {
        // Só adiciona filtro se não estiver buscando itens deletados explicitamente
        if (!params.args.where?.deletedAt) {
          params.args.where = {
            ...params.args.where,
            deletedAt: null,
          }
        }
      }

      // Delete - converte em update (soft delete)
      if (action === 'delete') {
        params.action = 'update'
        params.args.data = { deletedAt: new Date() }
      }

      // DeleteMany - converte em updateMany (soft delete)
      if (action === 'deleteMany') {
        params.action = 'updateMany'
        params.args.data = { deletedAt: new Date() }
      }
    }

    return next(params)
  }
}
