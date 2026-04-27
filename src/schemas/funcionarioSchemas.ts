import { z } from 'zod';

const normalizeNumbers = (val: string) => val.replace(/\D/g, '');

const TipoConta = z.enum(['CORRENTE', 'POUPANCA', 'SALARIO', 'PAGAMENTO']);
const TipoChavePix = z.enum(['CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATORIA']);

export const dadosBancariosSchema = z.object({
  banco: z.string().max(50).trim().optional().nullable(),
  agencia: z.string().max(10).trim().optional().nullable(),
  agenciaDigito: z.string().max(2).trim().optional().nullable(),
  conta: z.string().max(20).trim().optional().nullable(),
  contaDigito: z.string().max(2).trim().optional().nullable(),
  tipoConta: TipoConta.default('CORRENTE'),
  chavePix: z.string().max(100).trim().optional().nullable(),
  tipoChavePix: TipoChavePix.optional().nullable(),
});

export const criarFuncionarioSchema = z.object({
  body: z.object({
    nome: z.string().min(3).max(100).trim(),
    cpf: z.string().transform(normalizeNumbers).refine(val => val.length === 11, 'CPF inválido'),
    rg: z.string().max(20).trim().optional().nullable(),
    dataNascimento: z.coerce.date().optional(),
    cargo: z.enum(['PROFESSOR', 'COORDENADOR', 'SECRETARIA', 'DIRETOR', 'AUXILIAR', 'OUTRO']),
    salarioBase: z.number().nonnegative('O salário base não pode ser negativo').default(0),
    telefone: z.string().max(20).transform(normalizeNumbers).optional().nullable(),
    email: z.string().email().max(100).toLowerCase().trim().optional().nullable(),
    enderecoId: z.string().uuid().optional().nullable(),
    dadosBancarios: dadosBancariosSchema.optional(),
  }),
});

export const atualizarFuncionarioSchema = z.object({
  params: z.object({ id: z.string().uuid('ID inválido') }),
  body: criarFuncionarioSchema.shape.body.partial().extend({
    statusFuncionario: z.enum(['ATIVO', 'AFASTADO', 'DEMITIDO', 'APOSENTADO']).optional()
  }).optional()
});

export const registrarPagamentoSchema = z.object({
  params: z.object({ id: z.string().uuid('ID do funcionário inválido') }),
  body: z.object({
    mesReferencia: z.number().int().min(1).max(12),
    anoReferencia: z.number().int().min(2024),
    salarioAcrescimos: z.number().min(0).default(0),
    salarioDesconto: z.number().min(0).default(0),
    formaPagamento: z.string().max(50).trim(),
    observacoes: z.string().max(500).optional().nullable(),
  }),
});

/**
 * Schema para listar funcionários com filtros
 */
export const listarFuncionariosSchema = z.object({
  query: z.object({
    page: z.string()
      .regex(/^\d+$/, 'Page deve ser número')
      .transform(Number)
      .optional(),

    limit: z.string()
      .regex(/^\d+$/, 'Limit deve ser número')
      .transform(Number)
      .optional(),

    cargo: z.enum([
      'PROFESSOR',
      'COORDENADOR',
      'DIRETOR',
      'SECRETARIA',
      'AUXILIAR',
      'OUTRO'
    ]).optional(),

    busca: z.string()
      .min(1)
      .optional(),
  }).optional(),
})
/**
 * Schema para buscar por ID
*/
export const idFuncionarioSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
})
