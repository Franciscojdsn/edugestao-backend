import { z } from 'zod'

const normalize = (val: string) => val.replace(/\D/g, '');

export const criarEscolaSchema = z.object({
  body: z.object({
    nome: z.string().min(3).max(150).trim(),
    cnpj: z.string().transform(normalize).refine(val => val.length === 14, "CNPJ deve ter 14 dígitos"),
    telefone: z.string().max(20).transform(normalize).optional().nullable(),
    email: z.string().email().toLowerCase().max(100).optional().nullable(),
    mensalidadePadrao: z.number().min(0).default(0),
    diaVencimento: z.number().int().min(1).max(28).default(10),
  }),
});

// Padrão solicitado: Reaproveitamento do shape para Partial Update
export const atualizarEscolaSchema = z.object({
  params: z.object({ id: z.string().uuid('ID de escola inválido') }),
  body: criarEscolaSchema.shape.body.partial()
});

// Schema para buscar por ID
export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
})
