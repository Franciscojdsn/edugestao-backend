import { z } from 'zod'

export const criarOcorrenciaSchema = z.object({
  body: z.object({
    titulo: z.string().min(3).max(200),
    descricao: z.string().min(10),
    tipo: z.enum(['COMPORTAMENTO', 'FALTA_DISCIPLINAR', 'BULLYING', 'ATRASO', 'UNIFORME', 'MATERIAL', 'OUTROS']),
    gravidade: z.enum(['LEVE', 'MODERADA', 'GRAVE', 'GRAVISSIMA']).default('LEVE'),
    alunoId: z.string().uuid(),
    funcionarioId: z.string().uuid(),
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    acaoTomada: z.string().optional(),
  }),
})

export const atualizarOcorrenciaSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    titulo: z.string().min(3).max(200).optional(),
    descricao: z.string().min(10).optional(),
    acaoTomada: z.string().optional(),
    responsavelAcao: z.string().optional(),
  }),
})

export const listarOcorrenciasSchema = z.object({
  query: z.object({
    tipo: z.enum(['COMPORTAMENTO', 'FALTA_DISCIPLINAR', 'BULLYING', 'ATRASO', 'UNIFORME', 'MATERIAL', 'OUTROS']).optional(),
    gravidade: z.enum(['LEVE', 'MODERADA', 'GRAVE', 'GRAVISSIMA']).optional(),
    alunoId: z.string().uuid().optional(),
    funcionarioId: z.string().uuid().optional(),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }).optional(),
})