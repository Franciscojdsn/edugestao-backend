import { z } from 'zod'

// Schema para criar escola
export const criarEscolaSchema = z.object({
  body: z.object({
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
    telefone: z.string().optional(),
    email: z.string().email('Email inválido').optional(),
    mensalidadePadrao: z.number().positive('Valor deve ser positivo').optional(),
    diaVencimento: z.number().int().min(1).max(31, 'Dia deve ser entre 1 e 31').optional(),
  }),
})

// Schema para atualizar escola
export const atualizarEscolaSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    nome: z.string().min(3).optional(),
    cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/).optional(),
    telefone: z.string().optional(),
    email: z.string().email().optional(),
    mensalidadePadrao: z.number().positive().optional(),
    diaVencimento: z.number().int().min(1).max(31).optional(),
  }),
})

// Schema para buscar por ID
export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
})
