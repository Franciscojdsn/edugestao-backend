import { z } from 'zod';

export const listarLogsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    // Trava do Arquiteto: Ninguém busca mais que 500 logs de uma vez na tela
    limit: z.coerce.number().int().min(1).max(500).default(20),
    entidade: z.string().max(100).optional(),
    acao: z.string().max(100).optional(),
    usuarioId: z.string().uuid('ID de usuário inválido').optional(),
    dataInicio: z.coerce.date().optional(),
    dataFim: z.coerce.date().optional(),
  }),
});

export const estatisticasLogsSchema = z.object({
  query: z.object({
    dataInicio: z.coerce.date().optional(),
    dataFim: z.coerce.date().optional(),
  }),
});

export const detalhesLogSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de log inválido'),
  }),
});