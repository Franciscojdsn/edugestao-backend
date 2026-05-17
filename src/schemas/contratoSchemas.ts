import { z } from 'zod';

export const criarContratoSchema = z.object({
  body: z.object({
    alunoId: z.string().uuid('ID do aluno inválido'),
    responsavelFinanceiroId: z.string().uuid('Responsável financeiro inválido'),

    // Valores Monetários
    valorMatricula: z.number().min(0).max(10000),
    descontoMatricula: z.number().min(0).max(1000),
    valorMensalidadeBase: z.number().positive('Mensalidade base deve ser maior que zero').max(10000),
    descontoMensalidade: z.number().min(0).max(1000),

    // Configurações e Matriz Temporal
    diaVencimento: z.number().int().min(1).max(28, 'Para segurança, use vencimentos até o dia 28'),
    anoFaturamento: z.number().int().min(2024).max(2100),
    mesesFaturamento: z.array(z.number().int().min(1).max(12)).min(1, 'A matriz de meses não pode ser vazia'),

    dataInicio: z.coerce.date().optional(),
    status: z.enum(['ATIVO', 'SUSPENSO', 'CANCELADO', 'FINALIZADO']).default('ATIVO'),
  }).strict(),
});

export const atualizarContratoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do contrato inválido'),
  }),
  body: z.object({
    valorMensalidadeBase: z.number().positive().optional(),
    descontoMensalidade: z.number().min(0).optional(),
    diaVencimento: z.number().int().min(1).max(28).optional(),
    anoFaturamento: z.number().int().min(2024).max(2100).optional(),
    mesesFaturamento: z.array(z.number().int().min(1).max(12)).optional(),
    status: z.enum(['ATIVO', 'SUSPENSO', 'CANCELADO', 'FINALIZADO']).optional(),
    ativo: z.boolean().optional(),
  }).strict(),
});

export const listarContratosSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    status: z.enum(['ATIVO', 'SUSPENSO', 'CANCELADO', 'FINALIZADO']).optional(),
    alunoId: z.string().uuid().optional(),
  }),
});

export const suspenderContratoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do contrato inválido'),
  }),
  body: z.object({
    motivo: z.string().min(5, 'O motivo deve ter no mínimo 5 caracteres').max(255).optional(),
  }).strict(),
});

export const updateFinanceiroSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do contrato inválido'),
  }),
  body: z.object({
    valorMensalidadeBase: z.number().positive(),
    descontoMensalidade: z.number().min(0),
    diaVencimento: z.number().int().min(1).max(28),
    mesesFaturamento: z.array(z.number().int().min(1).max(12)).min(1, 'Defina a nova matriz de faturamento.'),
    atividadesExtras: z.array(z.object({
      atividadeExtraId: z.string().uuid(),
      ativo: z.boolean()
    })).optional()
  }).strict(),
});