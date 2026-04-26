import { AsyncLocalStorage } from 'async_hooks'

interface RequestContext {
  escolaId?: string
  userId?: string
  role?: string
}

export const requestContext = new AsyncLocalStorage<RequestContext>()

export function getContext(): RequestContext {
  const context = requestContext.getStore()
  if (!context) {
    // Em produção, isso garante que nenhuma query rode sem contexto
    return {} 
  }
  return context
}

// Helper para garantir que o escolaId existe antes de uma operação crítica
export function getRequiredEscolaId(): string {
  const id = getContext().escolaId;
  if (!id) throw new Error("Falha Crítica: escolaId não encontrado no contexto.");
  return id;
}

export function getEscolaId() { return getContext().escolaId }
export function getUserId() { return getContext().userId }