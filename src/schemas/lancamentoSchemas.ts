import { z } from 'zod'
import { TipoTransacao } from '@prisma/client' // Importe o Enum do Prisma

export const criarLancamentoSchema = z.object({
  body: z.object({
    descricao: z.string().min(3, 'Descrição muito curta').max(255),
    
    // A mágica acontece aqui:
    tipo: z.nativeEnum(TipoTransacao),
    
    categoria: z.string().min(1, 'Categoria é obrigatória'),
    valor: z.number().positive('O valor deve ser maior que zero'),
    dataVencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato AAAA-MM-DD'),
    alunoId: z.string().uuid().optional().nullable(),
    funcionarioId: z.string().uuid().optional().nullable(),
  }),
})

export const liquidarLancamentoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    dataPagamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    formaPagamento: z.string().default('DINHEIRO'),
  }),
})

export const listarLancamentosSchema = z.object({
  query: z.object({
    tipo: z.nativeEnum(TipoTransacao).optional(),
    status: z.enum(['PENDENTE', 'PAGO', 'CANCELADO']).optional(),
    mes: z.string().optional().transform(v => v ? Number(v) : undefined),
    ano: z.string().optional().transform(v => v ? Number(v) : undefined),
  }),
})