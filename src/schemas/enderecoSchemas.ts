import { z } from 'zod';

const normalizeNumbers = (val: string) => val.replace(/\D/g, '');

export const criarEnderecoSchema = z.object({
  body: z.object({
    rua: z.string().min(3).max(150, 'Rua excede 150 caracteres').trim(),
    numero: z.string().min(1).max(20, 'Número excede 20 caracteres').trim(),
    complemento: z.string().max(100).trim().optional().nullable(),
    bairro: z.string().min(2).max(100).trim(),
    cidade: z.string().min(2).max(100).trim(),
    estado: z.string().length(2, 'Estado deve ter exatos 2 caracteres (UF)').toUpperCase(),
    
    // Transforma "00000-000" em "00000000" antes de salvar
    cep: z.string()
      .transform(normalizeNumbers)
      .refine(val => val.length === 8, 'CEP deve conter exatos 8 dígitos'),
  }),
});

export const atualizarEnderecoSchema = z.object({
  params: z.object({ id: z.string().uuid('ID de endereço inválido') }),
  body: criarEnderecoSchema.shape.body.partial()
});