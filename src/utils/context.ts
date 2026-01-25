import { AsyncLocalStorage } from 'async_hooks'

interface RequestContext {
  escolaId?: string
  userId?: string
  role?: string
}

// AsyncLocalStorage para armazenar contexto da requisição
export const requestContext = new AsyncLocalStorage<RequestContext>()

/**
 * Pega o contexto da requisição atual
 */
export function getContext(): RequestContext {
  return requestContext.getStore() || {}
}

/**
 * Pega o escolaId da requisição atual
 */
export function getEscolaId(): string | undefined {
  return getContext().escolaId
}

/**
 * Pega o userId da requisição atual
 */
export function getUserId(): string | undefined {
  return getContext().userId
}
