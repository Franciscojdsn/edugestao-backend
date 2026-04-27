import { z } from 'zod'

// Nota: Certifique-se de que o enum TipoTransacao seja importado do Prisma ou recriado aqui.
const TipoTransacao = z.enum(['ENTRADA', 'SAIDA']);
const StatusPagamento = z.enum(['PENDENTE', 'PAGO', 'CANCELADO', 'VENCIDO']);

export const criarLancamentoSchema = z.object({
  body: z.object({
    descricao: z.string().min(3, 'Descrição muito curta').max(255, 'Máximo 255 caracteres').trim(),
    tipo: TipoTransacao,
    categoria: z.string().min(1, 'Categoria é obrigatória').max(100).trim(),
    valor: z.number().positive('O valor deve ser maior que zero').max(9999999, 'Valor excede limite do sistema'),
    dataVencimento: z.coerce.date()
      .refine(d => d.getFullYear() >= 2020 && d.getFullYear() <= 2100, "Ano fora do intervalo permitido (2020-2100)"),

    // Relacionamentos Opcionais
    alunoId: z.string().uuid().optional().nullable(),
    funcionarioId: z.string().uuid().optional().nullable(),
    responsavelId: z.string().uuid().optional().nullable(),
  }),
});

export const liquidarLancamentoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    dataPagamento: z.coerce.date()
      .refine(d => d <= new Date(), "Data de pagamento não pode ser no futuro")
      .optional(),
    formaPagamento: z.string().min(2, "Forma de pagamento inválida").max(50).trim().default('DINHEIRO'),
  }),
});

export const listarLancamentosSchema = z.object({
  query: z.object({
    tipo: TipoTransacao.optional(),
    status: StatusPagamento.optional(),
    mes: z.coerce.number().min(1).max(12).optional(),
    ano: z.coerce.number().min(2020).max(2100).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

export const deletarLancamentoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
})

export const estornarLancamentoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    motivo: z.string().min(5, 'O motivo do estorno deve ter pelo menos 5 caracteres').max(255, 'Máximo 255 caracteres').trim(),
  }),
})