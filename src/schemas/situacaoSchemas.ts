import { z } from 'zod';

const FormaPagamentoEnum = z.enum(['DINHEIRO', 'PIX', 'CARTAO', 'BOLETO', 'TRANSFERENCIA']);
const StatusPagamentoEnum = z.enum(['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']);

export const listarPagamentosSchema = z.object({
  query: z.object({
    alunoId: z.string().uuid().optional(),
    status: StatusPagamentoEnum.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    busca: z.string().max(100).optional(), // Para buscar por nome do aluno ou referência
  }),
});

export const registrarPagamentoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do boleto inválido'),
  }),
  body: z.object({
    dataPagamento: z.coerce.date(),
    valorPago: z.number().positive('O valor pago deve ser maior que zero').max(999999),
    formaPagamento: FormaPagamentoEnum,
    observacoes: z.string().max(500, 'Observação excede 500 caracteres').trim().optional().nullable(),
  }),
});

export const estornarPagamentoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do boleto inválido'),
  }),
  body: z.object({
    motivo: z.string().min(5, 'Explique o motivo do estorno').max(255).trim(),
  }),
});