import { z } from 'zod'

export const criarComunicadoSchema = z.object({
  body: z.object({
    titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(200),
    mensagem: z.string().min(10, 'Mensagem deve ter no mínimo 10 caracteres'),
    tipo: z.enum(['GERAL', 'FINANCEIRO', 'PEDAGOGICO', 'EVENTO', 'URGENTE']).default('GERAL'),
    prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).default('NORMAL'),
    
    // Destinatários (opcional - se não informar, envia para todos)
    alunoId: z.string().uuid().optional(),
    turmaId: z.string().uuid().optional(),
    responsavelId: z.string().uuid().optional(),
  }),
})

export const listarComunicadosSchema = z.object({
  query: z.object({
    tipo: z.enum(['GERAL', 'FINANCEIRO', 'PEDAGOGICO', 'EVENTO', 'URGENTE']).optional(),
    prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
    alunoId: z.string().uuid().optional(),
    turmaId: z.string().uuid().optional(),
    lido: z.string().regex(/^(true|false)$/).transform(val => val === 'true').optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }).optional(),
})

export const marcarLidoSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
})

export const enviarComunicadoMassaSchema = z.object({
  body: z.object({
    titulo: z.string().min(3).max(200),
    mensagem: z.string().min(10),
    tipo: z.enum(['GERAL', 'FINANCEIRO', 'PEDAGOGICO', 'EVENTO', 'URGENTE']),
    prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).default('NORMAL'),
    destinatarios: z.enum(['TODOS', 'TURMA', 'INADIMPLENTES']),
    turmaId: z.string().uuid().optional(),
  }),
})