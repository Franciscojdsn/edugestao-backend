import { prisma } from '../config/prisma'

export interface LogAuditoriaParams {
  entidade: string
  entidadeId: string
  acao: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ'
  dadosAntigos?: any
  dadosNovos?: any
  usuarioId: string
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
        dadosAntigos: params.dadosAntigos || null,
        dadosNovos: params.dadosNovos || null,
        usuarioId: params.usuarioId,
        escolaId: params.escolaId,
        ip: params.ip || null,
      },
    })
  } catch (error) {
    // Log nunca deve quebrar a aplicação
    console.error('[LOG AUDITORIA] Erro ao registrar:', error)
  }
}