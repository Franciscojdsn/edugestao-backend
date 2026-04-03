// src/schemas/boletoSchemas.ts
import { z } from 'zod';

export const liquidarBoletoSchema = z.object({
  params: z.object({
    id: z.string().uuid('O ID do boleto deve ser um UUID válido.'),
  }),
  body: z.object({
    // O preprocess garante que se vier 'dinheiro' minúsculo, ele vira 'DINHEIRO'
    formaPagamento: z.preprocess(
      (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
      z.enum(['DINHEIRO', 'PIX', 'CARTAO', 'BOLETO', 'TRANSFERENCIA'], {
        // Usando a chave 'error' que a sua versão do Zod exige:
        error: "Forma de pagamento inválida. Use DINHEIRO, PIX, CARTAO, BOLETO ou TRANSFERENCIA."
      })
    ),
  }),
});