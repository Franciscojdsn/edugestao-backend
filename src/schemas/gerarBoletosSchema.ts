import { z } from 'zod';

export const gerarBoletosContratoSchema = z.object({
  params: z.object({
    contratoId: z.string().uuid('ID de contrato inválido'),
  }),
  body: z.object({
    meses: z.number().int().min(1).max(12).default(12),
    mesInicio: z.number().int().min(1).max(12).default(new Date().getMonth() + 1),
    anoInicio: z.number().int().min(2024).max(2100).default(new Date().getFullYear()),
  }),
});

export const gerarPagamentoAvulsoSchema = z.object({
  body: z.object({
    alunoId: z.string().uuid('ID de aluno inválido'),
    referencia: z.string().min(1).max(50, 'Referência excede 50 caracteres').trim(),
    valorTotal: z.number().positive('O valor do pagamento deve ser maior que zero'),
    dataVencimento: z.coerce.date(),
    descricao: z.string().max(255).trim().optional().nullable(),
    observacoes: z.string().max(500).trim().optional().nullable(),
  }),
});