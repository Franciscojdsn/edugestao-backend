"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.funcionarioController = void 0;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middlewares/errorHandler");
const prismaHelpers_1 = require("../utils/prismaHelpers");
// ============================================
// CONTROLLER - FUNCIONÁRIOS
// ============================================
exports.funcionarioController = {
    /**
     * GET /funcionarios - Listar com filtros e paginação
     */
    async list(req, res) {
        const { page = 1, limit = 20, cargo, busca } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        // Construir filtros
        let where = {};
        if (cargo)
            where.cargo = cargo;
        // Busca por nome ou CPF
        if (busca) {
            where.OR = [
                {
                    nome: {
                        contains: busca,
                        mode: 'insensitive',
                    },
                },
                {
                    cpf: {
                        contains: busca,
                        mode: 'insensitive',
                    },
                },
            ];
        }
        // Aplicar multi-tenancy e soft delete
        where = (0, prismaHelpers_1.withTenancy)(where);
        // Buscar funcionários + contagem total
        const [funcionarios, total] = await Promise.all([
            prisma_1.prisma.funcionario.findMany({
                where,
                skip,
                take: Number(limit),
                select: {
                    id: true,
                    nome: true,
                    cpf: true,
                    cargo: true,
                    telefone: true,
                    email: true,
                    dataAdmissao: true,
                    createdAt: true,
                    _count: {
                        select: {
                            turmas: true,
                        },
                    },
                },
                orderBy: {
                    nome: 'asc',
                },
            }),
            prisma_1.prisma.funcionario.count({ where }),
        ]);
        return res.json({
            data: funcionarios,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    },
    /**
     * GET /funcionarios/:id - Buscar por ID
     */
    async show(req, res) {
        const { id } = req.params;
        const idFormatado = Array.isArray(id) ? id[0] : id;
        const funcionario = await prisma_1.prisma.funcionario.findFirst({
            where: (0, prismaHelpers_1.withTenancy)({ id: idFormatado }),
            include: {
                endereco: true,
                dadosBancarios: true, // Adicionado para carregar dados bancários
                pagamentoSalarios: {
                    orderBy: [
                        { anoReferencia: 'desc' },
                        { mesReferencia: 'desc' }
                    ]
                },
                turmas: {
                    select: {
                        turma: {
                            select: {
                                id: true,
                                nome: true,
                                turno: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        turmas: true,
                    },
                },
            },
        });
        if (!funcionario) {
            throw new errorHandler_1.AppError('Funcionário não encontrado', 404);
        }
        return res.json(funcionario);
    },
    /**
     * POST /funcionarios - Criar novo funcionário
     */
    async create(req, res) {
        const { salarioBase, dadosBancarios, endereco, ...dados } = req.body;
        const escolaId = req.user?.escolaId;
        if (!escolaId) {
            throw new errorHandler_1.AppError('Escola não identificada', 400);
        }
        // Verificar se CPF já existe
        const cpfExiste = await prisma_1.prisma.funcionario.findFirst({
            where: (0, prismaHelpers_1.withEscolaId)({
                cpf: dados.cpf,
            }),
        });
        if (cpfExiste) {
            throw new errorHandler_1.AppError('CPF já cadastrado', 400);
        }
        // Converter dataAdmissao para DateTime se fornecido
        if (dados.dataAdmissao) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dados.dataAdmissao)) {
                dados.dataAdmissao = new Date(dados.dataAdmissao).toISOString();
            }
        }
        // Criar funcionário
        const funcionario = await prisma_1.prisma.funcionario.create({
            data: {
                ...dados,
                dataAdmissao: dados.dataAdmissao ? new Date(dados.dataAdmissao) : undefined,
                salarioBase: Number(salarioBase),
                // SOLUÇÃO: Use o 'connect' em vez de passar a string direto
                escola: {
                    connect: { id: escolaId }
                },
                endereco: endereco ? {
                    create: endereco
                } : undefined,
                dadosBancarios: dadosBancarios ? {
                    create: {
                        ...dadosBancarios,
                        escolaId // Aqui dentro não tem problema, pois é a criação da tabela filha
                    }
                } : undefined
            },
            include: {
                endereco: true,
                dadosBancarios: true
            },
        });
        return res.status(201).json(funcionario);
    },
    /**
     * PUT /funcionarios/:id - Atualizar funcionário
     */
    async update(req, res) {
        const { id } = req.params;
        const idFormatado = Array.isArray(id) ? id[0] : id;
        const escolaId = req.user?.escolaId;
        const usuarioLogadoId = req.user?.userId;
        if (!escolaId)
            throw new errorHandler_1.AppError('Escola não identificada', 400);
        // Verificar se funcionário existe e pertence à escola
        const funcionarioExistente = await prisma_1.prisma.funcionario.findFirst({
            where: (0, prismaHelpers_1.withTenancy)({ id: idFormatado }),
            include: { dadosBancarios: true }
        });
        if (!funcionarioExistente) {
            throw new errorHandler_1.AppError('Funcionário não encontrado', 404);
        }
        // Se está alterando CPF, verificar duplicação
        if (req.body.cpf && req.body.cpf !== funcionarioExistente.cpf) { // Manter req.body.cpf para a validação inicial antes da desestruturação completa
            const cpfEmUso = await prisma_1.prisma.funcionario.findFirst({
                where: (0, prismaHelpers_1.withEscolaId)({
                    cpf: req.body.cpf, // Usar req.body.cpf aqui
                    id: { not: idFormatado },
                }),
            });
            if (cpfEmUso) {
                throw new errorHandler_1.AppError('CPF já cadastrado', 400);
            }
        }
        // Desestruturação rigorosa para limpar o payload de dados indesejados
        // e isolar campos com tratamento especial.
        const { id: _id, // Descartado: ID vem dos params
        escolaId: _escolaId, // Descartado: escolaId vem do req.user
        createdAt: _createdAt, // Descartado: metadado
        updatedAt: _updatedAt, // Descartado: metadado
        deletedAt: _deletedAt, // Descartado: metadado
        turmas: _turmas, // Descartado: relação (se o frontend enviar)
        enderecoId: _enderecoId, // Descartado: ID da relação (usamos o objeto endereco)
        pagamentoSalarios: _pagamentoSalarios, // Descartado: relação (não deve ser atualizada por aqui)
        _count: _count, // Descartado: metadado
        // Campos com tratamento especial
        endereco, dataAdmissao, salarioBase, dadosBancarios, 
        // Agrupa todos os outros campos válidos (nome, cpf, cargo, email, telefone, etc.)
        ...dadosLimpos } = req.body;
        // Sanitização profunda para o Prisma (remover IDs e metadados de objetos aninhados)
        const cleanEndereco = endereco ? (() => {
            const { id, createdAt, updatedAt, ...rest } = endereco;
            return rest;
        })() : undefined;
        const cleanDadosBancarios = dadosBancarios ? (() => {
            const { id, createdAt, updatedAt, escolaId: _e, ...rest } = dadosBancarios;
            return rest;
        })() : undefined;
        const resultado = await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Auditoria de Salário
            if (salarioBase !== undefined && Number(salarioBase) !== Number(funcionarioExistente.salarioBase)) {
                await tx.logAuditoria.create({
                    data: {
                        entidade: 'FUNCIONARIO',
                        entidadeId: idFormatado,
                        acao: 'ALTERACAO_SALARIO',
                        usuarioId: usuarioLogadoId,
                        escolaId: escolaId, // Garantir que escolaId não é undefined
                        ip: req.ip || ''
                    }
                });
            }
            // 2. Auditoria de Dados Bancários (Simplificada para aceitar ambos)
            if (dadosBancarios) {
                await tx.logAuditoria.create({
                    data: {
                        entidade: 'FUNCIONARIO',
                        entidadeId: idFormatado,
                        acao: 'ALTERACAO_DADOS_BANCARIOS',
                        usuarioId: usuarioLogadoId,
                        escolaId: escolaId, // Garantir que escolaId não é undefined
                        ip: req.ip || ''
                    }
                });
            }
            return tx.funcionario.update({
                where: { id: idFormatado },
                data: {
                    ...dadosLimpos, // Campos válidos restantes
                    salarioBase: salarioBase !== undefined ? Number(salarioBase) : undefined,
                    dataAdmissao: dataAdmissao ? new Date(dataAdmissao) : undefined,
                    endereco: endereco ? {
                        upsert: {
                            create: cleanEndereco,
                            update: cleanEndereco
                        }
                    } : undefined,
                    dadosBancarios: dadosBancarios ? {
                        upsert: {
                            create: { ...cleanDadosBancarios, escolaId },
                            update: { ...cleanDadosBancarios }
                        }
                    } : undefined
                },
                include: { endereco: true, dadosBancarios: true }
            });
        });
        return res.json(resultado);
    },
    /**
     * POST /funcionarios/:id/pagar-salario - Registrar pagamento de salário
     */
    async registrarPagamento(req, res) {
        const { id } = req.params;
        const idFormatado = Array.isArray(id) ? id[0] : id;
        const escolaId = req.user?.escolaId;
        const usuarioLogadoId = req.user?.userId;
        const { mesReferencia, anoReferencia, salarioBase, salarioAcrescimos, salarioDesconto, formaPagamento, observacoes } = req.body;
        // 1. Validar existência e status do funcionário
        const funcionario = await prisma_1.prisma.funcionario.findFirst({
            where: (0, prismaHelpers_1.withTenancy)({ id: idFormatado, statusFuncionario: 'ATIVO' })
        });
        if (!funcionario) {
            throw new errorHandler_1.AppError('Funcionário não encontrado ou não está ativo no sistema.', 404);
        }
        // 2. Cálculo Blindado do Valor Líquido
        const valorLiquido = Number(salarioBase) + Number(salarioAcrescimos) - Number(salarioDesconto);
        // 3. Executar Transação Atômica
        const resultado = await prisma_1.prisma.$transaction(async (tx) => {
            // Passo A: Criar o Lançamento Financeiro (Caixa)
            const lancamento = await tx.lancamento.create({
                data: {
                    tipo: 'SAIDA',
                    categoria: 'FOLHA_PAGAMENTO',
                    status: 'PAGO',
                    valor: valorLiquido,
                    descricao: `Pagamento de Salário - ${funcionario.nome} - Ref: ${mesReferencia}/${anoReferencia}`,
                    dataVencimento: new Date(),
                    dataLiquidacao: new Date(),
                    escolaId: escolaId
                }
            });
            // Passo B: Criar o Registro de Pagamento de Salário (RH)
            const pagamento = await tx.pagamentoSalario.create({
                data: {
                    funcionarioId: idFormatado,
                    lancamentoId: lancamento.id,
                    salarioBase,
                    salarioAcrescimos,
                    salarioDesconto,
                    valorLiquido,
                    mesReferencia,
                    anoReferencia,
                    formaPagamento,
                    observacoes,
                    escolaId: escolaId
                }
            });
            return pagamento;
        });
        return res.status(201).json({
            message: 'Pagamento de salário registrado com sucesso.',
            data: resultado
        });
    },
    /**
     * DELETE /funcionarios/:id - Soft delete
     */
    async delete(req, res) {
        const { id } = req.params;
        const idFormatado = Array.isArray(id) ? id[0] : id;
        // Verificar se funcionário existe e pertence à escola
        const funcionario = await prisma_1.prisma.funcionario.findFirst({
            where: (0, prismaHelpers_1.withTenancy)({ id: idFormatado }),
            include: {
                _count: {
                    select: { turmas: true }
                }
            }
        });
        if (!funcionario) {
            throw new errorHandler_1.AppError('Funcionário não encontrado', 404);
        }
        // Regra de Segurança: Impedir demissão de professores com turmas ativas
        if (funcionario._count.turmas > 0) {
            throw new errorHandler_1.AppError('Não é possível demitir um colaborador com turmas sob sua responsabilidade. Realize a substituição do professor antes da demissão.', 400);
        }
        // Soft delete com alteração de status e data de demissão
        await prisma_1.prisma.funcionario.update({
            where: { id: idFormatado },
            data: {
                statusFuncionario: 'DEMITIDO',
                dataDemissao: new Date(),
                deletedAt: new Date(),
            },
        });
        return res.status(204).send();
    },
};
//# sourceMappingURL=funcionarioController.js.map