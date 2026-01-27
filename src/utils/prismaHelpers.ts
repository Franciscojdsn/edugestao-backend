import { getEscolaId } from './context'

/**
 * Adiciona escolaId automaticamente no where
 */
export function withEscolaId<T extends Record<string, any>>(where?: T): T {
  const escolaId = getEscolaId()
  
  if (!escolaId) {
    return (where || {}) as T
  }

  // O segredo está em converter para 'any' primeiro para evitar o erro de overlap
  return {
    ...where,
    escolaId,
  } as any as T 
}

/**
 * Adiciona deletedAt: null automaticamente (soft delete)
 */
export function withoutDeleted<T extends Record<string, any>>(where?: T): T {
  return {
    ...where,
    deletedAt: null,
  } as any as T
}

/**
 * Combina escolaId + deletedAt
 */
export function withTenancy<T extends Record<string, any>>(where?: T): T {
  // Como as funções acima já retornam T, o encadeamento funciona
  return withoutDeleted(withEscolaId(where))
}
