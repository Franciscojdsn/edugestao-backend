import { z } from 'zod'

export const gerarPagamentosContratoSchema = z.object({
  params: z.object({
    contratoId: z.string().uuid('ID de contrato inválido'),
  }),
  body: z.object({
    meses: z.number().int().min(1).max(12).default(12),
    mesInicio: z.number().int().min(1).max(12).default(1),
    anoInicio: z.number().int().min(2024).max(2030).default(2026),
  }),
})

export const gerarPagamentoAvulsoSchema = z.object({
  body: z.object({
    alunoId: z.string().uuid(),
    referencia: z.string().min(1),
    valorTotal: z.number().positive(),
    dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    observacoes: z.string().optional(),
  }),
})