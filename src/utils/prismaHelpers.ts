import { getEscolaId } from './context'

/**
 * Adiciona escolaId automaticamente no where
 * 
 * ⚠️ NÃO USAR PARA: Escola (ela não tem escolaId!)
 * ✅ USAR PARA: Aluno, Funcionario, Usuario, Turma, etc
 */
export function withEscolaId<T extends Record<string, any>>(where?: T): T {
  const escolaId = getEscolaId()
  
  if (!escolaId) {
    return where || ({} as T)
  }

  return {
    ...where,
    escolaId,
  } as T
}

/**
 * Adiciona deletedAt: null automaticamente (soft delete)
 * 
 * ✅ USAR PARA: Aluno, Funcionario, Transacao
 * ⚠️ NÃO USAR PARA: Escola, Usuario, Turma (não têm soft delete)
 */
export function withoutDeleted<T extends Record<string, any>>(where?: T): T {
  return {
    ...where,
    deletedAt: null,
  } as T
}

/**
 * Combina escolaId + deletedAt
 * 
 * ✅ USAR PARA: Aluno, Funcionario, Transacao
 */
export function withTenancy<T extends Record<string, any>>(where?: T): T {
  return withoutDeleted(withEscolaId(where))
}