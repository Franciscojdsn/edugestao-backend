import { z } from 'zod'

// ============================================
// SCHEMAS DE VALIDAÇÃO - FUNCIONÁRIO
// ============================================

/**
 * Enums Bancários (Equivalentes ao Prisma)
 */
const TipoConta = z.enum(['CORRENTE', 'POUPANCA']);
const TipoChavePix = z.enum(['CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATORIA']);

/**
 * Schema de Dados Bancários com Validação Condicional
 */
export const dadosBancariosSchema = z.object({
  banco: z.string().optional(),
  agencia: z.string().optional(),
  agenciaDigito: z.string().optional(),
  conta: z.string().optional(),
  contaDigito: z.string().optional(),
  tipoConta: TipoConta.default('CORRENTE'),
  chavePix: z.string().optional(),
  tipoChavePix: TipoChavePix.optional(),
});

/**
 * Schema para criar funcionário
 */
export const criarFuncionarioSchema = z.object({
  body: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter no mínimo 3 caracteres')
      .max(100, 'Nome muito longo'),
    
    cpf: z.string()
      .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (formato: 000.000.000-00)'),
    
    cargo: z.enum([
      'PROFESSOR',
      'COORDENADOR',
      'DIRETOR',
      'SECRETARIA',
      'AUXILIAR',
      'OUTRO'
    ], {
      error: () => ({ message: 'Cargo inválido' })
    }),
    
    especialidade: z.string()
      .max(100, 'Especialidade muito longa')
      .optional(),
    
    telefone: z.string()
      .min(10, 'Telefone inválido')
      .max(20, 'Telefone muito longo')
      .optional(),
    
    email: z.string()
      .email('Email inválido')
      .optional(),
    
    dataAdmissao: z.string()
      .datetime({ message: 'Data inválida (formato ISO)' })
      .optional()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato: YYYY-MM-DD)').optional()),

    salarioBase: z.number().nonnegative('O salário não pode ser negativo'),
    
    // Validação para criação aninhada do endereço
    endereco: z.object({
      rua: z.string().min(3, 'Rua muito curta').max(200),
      numero: z.string().max(20),
      complemento: z.string().max(100).optional(),
      bairro: z.string().min(3, 'Bairro muito curto').max(100),
      cidade: z.string().min(3, 'Cidade muito curta').max(100),
      estado: z.string().length(2, 'Use a sigla (Ex: SP)').toUpperCase(),
      cep: z.string()
        .regex(/^\d{5}-\d{3}$/, 'CEP inválido (formato: 00000-000)'),
    }).optional(),

    enderecoId: z.string().uuid('ID de endereço inválido').optional(),

    dadosBancarios: dadosBancariosSchema.optional(),
  }),
})

/**
 * Schema para atualizar funcionário
 */
export const atualizarFuncionarioSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter no mínimo 3 caracteres')
      .max(100, 'Nome muito longo')
      .optional(),
    
    cpf: z.string()
      .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
      .optional(),
    
    cargo: z.enum([
      'PROFESSOR',
      'COORDENADOR',
      'DIRETOR',
      'SECRETARIA',
      'AUXILIAR',
      'OUTRO'
    ]).optional(),
    
    especialidade: z.string()
      .max(100, 'Especialidade muito longa')
      .optional(),
    
    telefone: z.string()
      .min(10, 'Telefone inválido')
      .max(20, 'Telefone muito longo')
      .optional(),
    
    email: z.string()
      .email('Email inválido')
      .optional(),
    
    dataAdmissao: z.string()
      .datetime({ message: 'Data inválida' })
      .optional()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
    
    salarioBase: z.number()
      .nonnegative('O salário não pode ser negativo')
      .optional(),
    
    enderecoId: z.string()
      .uuid('ID de endereço inválido')
      .nullable()
      .optional(),
  }),
})

/**
 * Schema para edição de dados básicos do funcionário
 */
export const editarFuncionarioSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter no mínimo 3 caracteres')
      .max(100, 'Nome muito longo')
      .optional(),
    
    telefone: z.string()
      .min(10, 'Telefone inválido')
      .max(20, 'Telefone muito longo')
      .optional(),
    
    email: z.string()
      .email('Email inválido')
      .optional(),

    salarioBase: z.number()
      .nonnegative('O salário não pode ser negativo')
      .optional(),
    
    // Validação para atualização aninhada do endereço
    endereco: z.object({
      rua: z.string().min(3).max(200).optional(),
      numero: z.string().max(20).optional(),
      complemento: z.string().max(100).optional(),
      bairro: z.string().min(3).max(100).optional(),
      cidade: z.string().min(3).max(100).optional(),
      estado: z.string().length(2).toUpperCase().optional(),
      cep: z.string()
        .regex(/^\d{5}-\d{3}$/, 'CEP inválido (formato: 00000-000)')
        .optional(),
    }).optional(),

    dadosBancarios: dadosBancariosSchema.optional(),
  }),
})

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
 * Schema para registrar pagamento de salário
 */
export const registrarPagamentoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de funcionário inválido'),
  }),
  body: z.object({
    mesReferencia: z.number().int().min(1).max(12),
    anoReferencia: z.number().int().min(2000),
    salarioBase: z.number().nonnegative('O salário base é obrigatório'),
    salarioAcrescimos: z.number().nonnegative().default(0),
    salarioDesconto: z.number().nonnegative().default(0),
    formaPagamento: z.enum(['PIX', 'CONTA BANCARIA', 'DINHEIRO']),
    observacoes: z.string().optional(),
  }),
})

/**
 * Schema para buscar por ID
 */
export const idFuncionarioSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
})
