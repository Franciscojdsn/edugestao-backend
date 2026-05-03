// edugestao-backend/src/schemas/gerarBoletosSchema.ts
import { z } from 'zod';

export const gerarBoletosContratoSchema = z.object({
  params: z.object({
    contratoId: z.string().uuid('ID de contrato deve ser um UUID v4 válido'),
  }),
});

export const gerarPagamentoAvulsoSchema = z.object({
  body: z.object({
    alunoId: z.string().uuid('ID de aluno deve ser um UUID v4 válido'),
    valorTotal: z.number().positive('O valor do pagamento deve ser maior que zero'),
    dataVencimento: z.string().datetime({ message: 'Data de vencimento deve estar no formato ISO 8601' }),
    descricao: z.string().max(255).trim(),
    observacoes: z.string().max(500).trim().optional().nullable(),
  }),
});