import { z } from 'zod'

export const criarAtividadeSchema = z.object({
  body: z.object({
    nome: z.string().min(3).max(100, 'Nome excede 100 caracteres').trim(),
    descricao: z.string().max(100, 'Descrição excede 100 caracteres').trim().optional().nullable(),
    valor: z.number().nonnegative('O valor não pode ser negativo'),
    diaAula: z.enum(['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO', 'TODOS']).optional().nullable(),
    horario: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido. Use HH:MM').optional().nullable(),
    capacidadeMaxima: z.number().int().positive().optional().nullable(),
  }),
})

export const atualizarAtividadeSchema = z.object({
  params: z.object({ id: z.string().uuid('ID da atividade inválido') }),
  body: criarAtividadeSchema.shape.body.partial().extend({
    atualizarBoletosPendentes: z.boolean().optional(), // Flag de negócio
  }),
})

export const vincularAlunoAtividadeSchema = z.object({
  params: z.object({
    atividadeId: z.string().uuid('ID da atividade inválido'),
  }),
  body: z.object({
    alunoId: z.string().uuid('ID do aluno inválido'),
  })
})

export const desvincularAlunoAtividadeSchema = z.object({
  params: z.object({
    atividadeId: z.string().uuid('ID da atividade inválido'),
    alunoId: z.string().uuid('ID do aluno inválido')
  }),
})