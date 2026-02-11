import { prisma } from '../config/prisma'
import { Prisma } from '@prisma/client'

export interface LogAuditoriaParams {
  entidade: string
  entidadeId: string
  acao: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' | 'LOGIN' | 'ERROR'
  dadosAntigos?: any
  dadosNovos?: any
  usuarioId?: string | null | undefined
  escolaId: string
  ip?: string
}

export async function logAction(params: LogAuditoriaParams): Promise<void> {
  try {
    await prisma.logAuditoria.create({
      data: {
        entidade: params.entidade,
        entidadeId: params.entidadeId,
        acao: params.acao,
        escolaId: params.escolaId,
        ip: params.ip || null,
        usuarioId: params.usuarioId || null,
        dadosAntigos: params.dadosAntigos ?? Prisma.DbNull,
        dadosNovos: params.dadosNovos ?? Prisma.DbNull,
      },
    })
  } catch (error) {
    console.error('[LOG AUDITORIA] Erro:', error)
  }
}