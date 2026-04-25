"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idFuncionarioSchema = exports.registrarPagamentoSchema = exports.listarFuncionariosSchema = exports.editarFuncionarioSchema = exports.atualizarFuncionarioSchema = exports.criarFuncionarioSchema = exports.dadosBancariosSchema = void 0;
const zod_1 = require("zod");
// ============================================
// SCHEMAS DE VALIDAÇÃO - FUNCIONÁRIO
// ============================================
/**
 * Enums Bancários (Equivalentes ao Prisma)
 */
const TipoConta = zod_1.z.enum(['CORRENTE', 'POUPANCA']);
const TipoChavePix = zod_1.z.enum(['CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATORIA']);
/**
 * Schema de Dados Bancários com Validação Condicional
 */
exports.dadosBancariosSchema = zod_1.z.object({
    banco: zod_1.z.string().optional(),
    agencia: zod_1.z.string().optional(),
    agenciaDigito: zod_1.z.string().optional(),
    conta: zod_1.z.string().optional(),
    contaDigito: zod_1.z.string().optional(),
    tipoConta: TipoConta.default('CORRENTE'),
    chavePix: zod_1.z.string().optional(),
    tipoChavePix: TipoChavePix.optional(),
});
/**
 * Schema para criar funcionário
 */
exports.criarFuncionarioSchema = zod_1.z.object({
    body: zod_1.z.object({
        nome: zod_1.z.string()
            .min(3, 'Nome deve ter no mínimo 3 caracteres')
            .max(100, 'Nome muito longo'),
        cpf: zod_1.z.string()
            .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (formato: 000.000.000-00)'),
        cargo: zod_1.z.enum([
            'PROFESSOR',
            'COORDENADOR',
            'DIRETOR',
            'SECRETARIA',
            'AUXILIAR',
            'OUTRO'
        ], {
            error: () => ({ message: 'Cargo inválido' })
        }),
        especialidade: zod_1.z.string()
            .max(100, 'Especialidade muito longa')
            .optional(),
        telefone: zod_1.z.string()
            .min(10, 'Telefone inválido')
            .max(20, 'Telefone muito longo')
            .optional(),
        email: zod_1.z.string()
            .email('Email inválido')
            .optional(),
        dataAdmissao: zod_1.z.string()
            .datetime({ message: 'Data inválida (formato ISO)' })
            .optional()
            .or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato: YYYY-MM-DD)').optional()),
        salarioBase: zod_1.z.number().nonnegative('O salário não pode ser negativo'),
        // Validação para criação aninhada do endereço
        endereco: zod_1.z.object({
            rua: zod_1.z.string().min(3, 'Rua muito curta').max(200),
            numero: zod_1.z.string().max(20),
            complemento: zod_1.z.string().max(100).optional(),
            bairro: zod_1.z.string().min(3, 'Bairro muito curto').max(100),
            cidade: zod_1.z.string().min(3, 'Cidade muito curta').max(100),
            estado: zod_1.z.string().length(2, 'Use a sigla (Ex: SP)').toUpperCase(),
            cep: zod_1.z.string()
                .regex(/^\d{5}-\d{3}$/, 'CEP inválido (formato: 00000-000)'),
        }).optional(),
        enderecoId: zod_1.z.string().uuid('ID de endereço inválido').optional(),
        dadosBancarios: exports.dadosBancariosSchema.optional(),
    }),
});
/**
 * Schema para atualizar funcionário
 */
exports.atualizarFuncionarioSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID inválido'),
    }),
    body: zod_1.z.object({
        nome: zod_1.z.string()
            .min(3, 'Nome deve ter no mínimo 3 caracteres')
            .max(100, 'Nome muito longo')
            .optional(),
        cpf: zod_1.z.string()
            .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
            .optional(),
        cargo: zod_1.z.enum([
            'PROFESSOR',
            'COORDENADOR',
            'DIRETOR',
            'SECRETARIA',
            'AUXILIAR',
            'OUTRO'
        ]).optional(),
        especialidade: zod_1.z.string()
            .max(100, 'Especialidade muito longa')
            .optional(),
        telefone: zod_1.z.string()
            .min(10, 'Telefone inválido')
            .max(20, 'Telefone muito longo')
            .optional(),
        email: zod_1.z.string()
            .email('Email inválido')
            .optional(),
        dataAdmissao: zod_1.z.string()
            .datetime({ message: 'Data inválida' })
            .optional()
            .or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
        salarioBase: zod_1.z.number()
            .nonnegative('O salário não pode ser negativo')
            .optional(),
        enderecoId: zod_1.z.string()
            .uuid('ID de endereço inválido')
            .nullable()
            .optional(),
    }),
});
/**
 * Schema para edição de dados básicos do funcionário
 */
exports.editarFuncionarioSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID inválido'),
    }),
    body: zod_1.z.object({
        nome: zod_1.z.string()
            .min(3, 'Nome deve ter no mínimo 3 caracteres')
            .max(100, 'Nome muito longo')
            .optional(),
        telefone: zod_1.z.string()
            .min(10, 'Telefone inválido')
            .max(20, 'Telefone muito longo')
            .optional(),
        email: zod_1.z.string()
            .email('Email inválido')
            .optional(),
        salarioBase: zod_1.z.number()
            .nonnegative('O salário não pode ser negativo')
            .optional(),
        // Validação para atualização aninhada do endereço
        endereco: zod_1.z.object({
            rua: zod_1.z.string().min(3).max(200).optional(),
            numero: zod_1.z.string().max(20).optional(),
            complemento: zod_1.z.string().max(100).optional(),
            bairro: zod_1.z.string().min(3).max(100).optional(),
            cidade: zod_1.z.string().min(3).max(100).optional(),
            estado: zod_1.z.string().length(2).toUpperCase().optional(),
            cep: zod_1.z.string()
                .regex(/^\d{5}-\d{3}$/, 'CEP inválido (formato: 00000-000)')
                .optional(),
        }).optional(),
        dadosBancarios: exports.dadosBancariosSchema.optional(),
    }),
});
/**
 * Schema para listar funcionários com filtros
 */
exports.listarFuncionariosSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string()
            .regex(/^\d+$/, 'Page deve ser número')
            .transform(Number)
            .optional(),
        limit: zod_1.z.string()
            .regex(/^\d+$/, 'Limit deve ser número')
            .transform(Number)
            .optional(),
        cargo: zod_1.z.enum([
            'PROFESSOR',
            'COORDENADOR',
            'DIRETOR',
            'SECRETARIA',
            'AUXILIAR',
            'OUTRO'
        ]).optional(),
        busca: zod_1.z.string()
            .min(1)
            .optional(),
    }).optional(),
});
/**
 * Schema para registrar pagamento de salário
 */
exports.registrarPagamentoSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID de funcionário inválido'),
    }),
    body: zod_1.z.object({
        mesReferencia: zod_1.z.number().int().min(1).max(12),
        anoReferencia: zod_1.z.number().int().min(2000),
        salarioBase: zod_1.z.number().nonnegative('O salário base é obrigatório'),
        salarioAcrescimos: zod_1.z.number().nonnegative().default(0),
        salarioDesconto: zod_1.z.number().nonnegative().default(0),
        formaPagamento: zod_1.z.enum(['PIX', 'CONTA BANCARIA', 'DINHEIRO']),
        observacoes: zod_1.z.string().optional(),
    }),
});
/**
 * Schema para buscar por ID
 */
exports.idFuncionarioSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID inválido'),
    }),
});
//# sourceMappingURL=funcionarioSchemas.js.map