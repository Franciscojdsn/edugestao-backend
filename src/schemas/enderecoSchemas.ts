import { z } from 'zod'

export const criarEnderecoSchema = z.object({
  body: z.object({
    rua: z.string().min(3).max(200),
    numero: z.string().max(20),
    complemento: z.string().max(100).optional(),
    bairro: z.string().min(3).max(100),
    cidade: z.string().min(3).max(100),
    estado: z.string().length(2).toUpperCase(),
    cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido (formato: 00000-000)'),
  }),
})

export const atualizarEnderecoSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    rua: z.string().min(3).max(200).optional(),
    numero: z.string().max(20).optional(),
    complemento: z.string().max(100).optional(),
    bairro: z.string().min(3).max(100).optional(),
    cidade: z.string().min(3).max(100).optional(),
    estado: z.string().length(2).toUpperCase().optional(),
    cep: z.string().regex(/^\d{5}-\d{3}$/).optional(),
  }),
})