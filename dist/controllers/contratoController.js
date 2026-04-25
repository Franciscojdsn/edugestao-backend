"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contratoController = void 0;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middlewares/errorHandler");
const prismaHelpers_1 = require("../utils/prismaHelpers");
// Listar contratos
exports.contratoController = {
    async list(req, res) {
        const { page = 1, limit = 20, status, alunoId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        let where = {};
        if (status)
            where.status = status;
        if (alunoId)
            where.alunoId = alunoId;
        where.aluno = { escolaId: req.user?.escolaId, deletedAt: null };
        const [contratos, total] = await Promise.all([
            prisma_1.prisma.contrato.findMany({
                where,
                skip,
                take: Number(limit),
                include: {
                    aluno: { select: { id: true, nome: true, numeroMatricula: true } },
                    responsavelFinanceiro: { select: { id: true, nome: true } },
                    _count: { select: { transacoes: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.prisma.contrato.count({ where }),
        ]);
        return res.json({
            data: contratos,
            meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
        });
    },
    // Mostrar detalhes de um contrato
    async show(req, res) {
        const { id } = req.params;
        const idFormatado = Array.isArray(id) ? id[0] : id;
        const contrato = await prisma_1.prisma.contrato.findFirst({
            where: {
                id: idFormatado,
                aluno: { escolaId: req.user?.escolaId, deletedAt: null },
            },
            include: {
                aluno: {
                    select: {
                        nome: true,
                        numeroMatricula: true,
                        turma: { select: { nome: true } },
                    },
                },
                responsavelFinanceiro: {
                    select: {
                        nome: true,
                        cpf: true,
                        email: true,
                    },
                },
                transacoes: {
                    select: {
                        id: true,
                        motivo: true,
                        valor: true,
                        data: true,
                    },
                    orderBy: { data: 'asc' },
                },
            },
        });
        if (!contrato)
            throw new errorHandler_1.AppError('Contrato não encontrado', 404);
        return res.json(contrato);
    },
    // Criar um novo contrato
    async create(req, res) {
        const dados = req.body;
        const escolaId = req.user?.escolaId;
        const isStatus = dados.status ? dados.status : 'ATIVO';
        const aluno = await prisma_1.prisma.aluno.findFirst({
            where: (0, prismaHelpers_1.withTenancy)({ id: dados.alunoId }),
        });
        if (!aluno)
            throw new errorHandler_1.AppError('Aluno não encontrado', 404);
        const responsavel = await prisma_1.prisma.responsavel.findFirst({
            where: {
                id: dados.responsavelFinanceiroId,
                alunoId: dados.alunoId,
                isResponsavelFinanceiro: true,
            },
        });
        if (!responsavel)
            throw new errorHandler_1.AppError('Responsável financeiro não encontrado ou inválido', 404);
        const contratoExiste = await prisma_1.prisma.contrato.findFirst({
            where: {
                alunoId: dados.alunoId,
                status: isStatus,
            },
        });
        if (contratoExiste)
            throw new errorHandler_1.AppError('Aluno já possui contrato ativo', 400);
        const contrato = await prisma_1.prisma.contrato.create({
            data: {
                ...dados,
                escolaId,
                dataInicio: new Date(dados.dataInicio),
                dataFim: dados.dataFim ? new Date(dados.dataFim) : null,
            },
            include: {
                aluno: { select: { nome: true } },
                responsavelFinanceiro: { select: { nome: true } },
            },
        });
        return res.status(201).json(contrato);
    },
    // Atualizar um contrato
    async update(req, res) {
        const { id } = req.params;
        const dados = req.body;
        const idFormatado = Array.isArray(id) ? id[0] : id;
        const contratoExistente = await prisma_1.prisma.contrato.findFirst({
            where: {
                id: idFormatado,
                aluno: { escolaId: req.user?.escolaId, deletedAt: null },
            },
        });
        if (!contratoExistente)
            throw new errorHandler_1.AppError('Contrato não encontrado', 404);
        const contrato = await prisma_1.prisma.contrato.update({
            where: { id: idFormatado },
            data: {
                ...dados,
                dataFim: dados.dataFim ? new Date(dados.dataFim) : undefined,
            },
            include: {
                aluno: { select: { nome: true } },
                responsavelFinanceiro: { select: { nome: true } },
            },
        });
        return res.json(contrato);
    },
    // Cancelar um contrato
    async cancelar(req, res) {
        const dados = req.body;
        const { id } = req.params;
        const idFormatado = Array.isArray(id) ? id[0] : id;
        const isStatus = dados.status ? dados.status : 'CANCELADO';
        const contrato = await prisma_1.prisma.contrato.findFirst({
            where: {
                id: idFormatado,
                aluno: { escolaId: req.user?.escolaId, deletedAt: null },
            },
        });
        if (!contrato)
            throw new errorHandler_1.AppError('Contrato não encontrado', 404);
        const contratoAtualizado = await prisma_1.prisma.contrato.update({
            where: { id: idFormatado },
            data: {
                status: isStatus,
                dataFim: new Date(),
            },
        });
        return res.json(contratoAtualizado);
    },
    /**
     * POST /contratos/:id/suspender
     * Suspende o contrato, cancela boletos futuros pendentes e gera auditoria.
     */
    async suspender(req, res) {
        const { id } = req.params;
        const { motivo } = req.body;
        const escolaId = req.user?.escolaId;
        if (!escolaId) {
            throw new errorHandler_1.AppError('Escola ID não encontrado no contexto de autenticação', 400);
        }
        // 1. Busca contrato atual para validar posse e guardar snapshot para auditoria
        const contratoAtual = await prisma_1.prisma.contrato.findFirst({
            where: {
                id: id,
                escolaId, // Regra de Ouro: Multi-tenant
                ativo: true, // Só processa se estiver ativo
            },
            include: {
                aluno: { select: { id: true, nome: true } }
            }
        });
        if (!contratoAtual) {
            throw new errorHandler_1.AppError('Contrato não encontrado, não pertence à escola ou já está inativo.', 404);
        }
        if (contratoAtual.status === 'SUSPENSO') {
            throw new errorHandler_1.AppError('Este contrato já se encontra suspenso.', 400);
        }
        // 2. Transação Atômica (Prisma v7+)
        const resultado = await prisma_1.prisma.$transaction(async (tx) => {
            const hoje = new Date();
            // A. Atualiza o Contrato
            const contratoSuspenso = await tx.contrato.update({
                where: { id: contratoAtual.id },
                data: {
                    status: 'SUSPENSO',
                    ativo: false,
                    dataFim: hoje
                }
            });
            // B. Cancela os Boletos (Imutabilidade Financeira)
            const notaCancelamento = motivo
                ? `Cancelado por suspensão de contrato. Motivo: ${motivo}`
                : 'Cancelado por suspensão de contrato.';
            const boletosCancelados = await tx.boletos.updateMany({
                where: {
                    escolaId,
                    alunoId: contratoAtual.alunoId,
                    status: 'PENDENTE',
                    dataVencimento: { gt: hoje } // Apenas boletos a vencer
                },
                data: {
                    status: 'CANCELADO',
                    observacoes: notaCancelamento
                }
            });
            // C. Registro Rigoroso de Auditoria
            await tx.logAuditoria.create({
                data: {
                    entidade: 'Contrato',
                    entidadeId: contratoAtual.id,
                    acao: 'SUSPENSAO_CONTRATO',
                    dadosAntigos: JSON.parse(JSON.stringify({ status: contratoAtual.status, ativo: contratoAtual.ativo })),
                    dadosNovos: JSON.parse(JSON.stringify({
                        status: 'SUSPENSO',
                        ativo: false,
                        boletosCancelados: boletosCancelados.count,
                        motivo
                    })),
                    escolaId,
                    ip: req.ip || null
                }
            });
            // D. Desvincular o aluno da turma
            await tx.aluno.update({
                where: {
                    id: contratoAtual.alunoId,
                    escolaId // Regra de Ouro: Sempre filtrar por escolaId
                },
                data: {
                    turmaId: null,
                }
            });
            return {
                contrato: contratoSuspenso,
                boletosAfetados: boletosCancelados.count
            };
        });
        return res.status(200).json({
            message: 'Contrato suspenso com sucesso.',
            data: resultado
        });
    },
    /**
     * PATCH /contratos/:id/financeiro
     * Realiza a repactuação financeira do contrato.
     * Cancela boletos pendentes futuros e gera novos registros baseados nos novos termos.
     */
    async updateFinanceiro(req, res) {
        const { id } = req.params;
        const idFormatado = Array.isArray(id) ? id[0] : id;
        const { valorMensalidadeBase, descontoMensalidade, diaVencimento, atividadesExtras } = req.body;
        const escolaId = req.user?.escolaId;
        const usuarioId = req.user?.userId;
        console.log(`[UpdateFinanceiro] Iniciando repactuação para Contrato: ${idFormatado} | Escola: ${escolaId}`);
        if (!escolaId) {
            throw new errorHandler_1.AppError('Escola não identificada no contexto de autenticação', 403);
        }
        try {
            const resultado = await prisma_1.prisma.$transaction(async (tx) => {
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                // 1. Snapshot do Contrato
                const contratoAtual = await tx.contrato.findFirst({
                    where: { id: idFormatado, escolaId },
                });
                if (!contratoAtual) {
                    console.error(`[DEBUG-FINANCEIRO] ❌ Contrato ${idFormatado} não localizado para escola ${escolaId}`);
                    throw new errorHandler_1.AppError('Contrato não encontrado para esta unidade.', 404);
                }
                if (contratoAtual.status === 'CANCELADO') {
                    console.error(`[DEBUG-FINANCEIRO] ❌ Tentativa de repactuar contrato CANCELADO: ${idFormatado}`);
                    throw new errorHandler_1.AppError('Não é possível repactuar um contrato cancelado.', 400);
                }
                console.log(`[DEBUG-FINANCEIRO] 🔍 Contrato encontrado. Aluno ID: ${contratoAtual.alunoId}`);
                // 2. Atualizar valores do Contrato com Garantia de Tipos (Number)
                console.log(`[DEBUG-FINANCEIRO] 📝 Atualizando termos do contrato: Base=${valorMensalidadeBase}, Desconto=${descontoMensalidade}`);
                const contratoAtualizado = await tx.contrato.update({
                    where: { id: contratoAtual.id },
                    data: {
                        valorMensalidadeBase: Number(valorMensalidadeBase),
                        descontoMensalidade: Number(descontoMensalidade),
                        diaVencimento: Number(diaVencimento)
                    }
                });
                // 3. Atividades Extras: Padrão 'Limpar e Recriar' para estabilidade
                console.log(`[DEBUG-FINANCEIRO] 🧹 Limpando e recriando atividades extras para Aluno: ${contratoAtual.alunoId}`);
                await tx.alunoAtividadeExtra.deleteMany({
                    where: { alunoId: contratoAtual.alunoId }
                });
                if (atividadesExtras && Array.isArray(atividadesExtras)) {
                    const itensParaCriar = atividadesExtras
                        .filter((item) => item.ativo)
                        .map((item) => ({
                        alunoId: contratoAtual.alunoId,
                        atividadeExtraId: item.atividadeExtraId,
                        ativo: true,
                        dataInicio: hoje
                    }));
                    if (itensParaCriar.length > 0) {
                        console.log(`[DEBUG-FINANCEIRO] 📥 Inserindo ${itensParaCriar.length} novas atividades extras ativas.`);
                        await tx.alunoAtividadeExtra.createMany({
                            data: itensParaCriar
                        });
                    }
                }
                const atividadesVigor = await tx.alunoAtividadeExtra.findMany({
                    where: {
                        alunoId: contratoAtual.alunoId,
                        ativo: true,
                    },
                    include: {
                        atividadeExtra: { select: { valor: true } }
                    }
                });
                const valorTotalAtividades = atividadesVigor.reduce((acc, item) => {
                    return acc + (Number(item.atividadeExtra.valor) || 0);
                }, 0);
                const novoValorTotalBoleto = Number(valorMensalidadeBase) + Number(valorTotalAtividades) - Number(descontoMensalidade);
                console.log(`[DEBUG-FINANCEIRO] 🧮 Recálculo: Base(${valorMensalidadeBase}) + Extras(${valorTotalAtividades}) - Desc(${descontoMensalidade}) = Total(${novoValorTotalBoleto})`);
                // 4. Cancelar Boletos Pendentes Futuros
                console.log(`[DEBUG-FINANCEIRO] 🚫 Cancelando boletos pendentes futuros...`);
                const boletosParaCancelar = await tx.boletos.findMany({
                    where: {
                        alunoId: contratoAtual.alunoId,
                        status: 'PENDENTE',
                        dataVencimento: { gte: hoje },
                        deletedAt: null
                    }
                });
                if (boletosParaCancelar.length > 0) {
                    await tx.boletos.updateMany({
                        where: { id: { in: boletosParaCancelar.map(b => b.id) } },
                        data: {
                            status: 'CANCELADO',
                            observacoes: 'Cancelamento por repactuação financeira (Update Financeiro)'
                        }
                    });
                }
                // 5. Gerar Novos Boletos até Dezembro
                const mesAtual = hoje.getMonth() + 1;
                const anoAtual = hoje.getFullYear();
                const boletosGerados = [];
                console.log(`[DEBUG-FINANCEIRO] 📅 Gerando novos boletos do mês ${mesAtual} até Dezembro/${anoAtual}`);
                for (let m = mesAtual; m <= 12; m++) {
                    const boletoExistente = await tx.boletos.findFirst({
                        where: {
                            alunoId: contratoAtual.alunoId,
                            mesReferencia: m,
                            anoReferencia: anoAtual,
                            status: { in: ['PAGO', 'VENCIDO'] },
                            deletedAt: null
                        }
                    });
                    if (boletoExistente)
                        continue;
                    const referencia = `${String(m).padStart(2, '0')}/${anoAtual}`;
                    const dataVencimentoNovo = new Date(anoAtual, m - 1, Number(diaVencimento));
                    const novoBoleto = await tx.boletos.create({
                        data: {
                            alunoId: contratoAtual.alunoId,
                            escolaId,
                            referencia,
                            mesReferencia: m,
                            anoReferencia: anoAtual,
                            valorBase: Number(valorMensalidadeBase),
                            valorAtividades: Number(valorTotalAtividades),
                            valorTotal: Number(novoValorTotalBoleto),
                            dataVencimento: dataVencimentoNovo,
                            status: 'PENDENTE',
                            descricao: `Mensalidade Escolar (Repactuada) - Ref: ${referencia}`
                        }
                    });
                    boletosGerados.push(novoBoleto);
                }
                console.log(`[DEBUG-FINANCEIRO] ✅ Sucesso: ${boletosParaCancelar.length} boletos cancelados e ${boletosGerados.length} novos gerados.`);
                await tx.logAuditoria.create({
                    data: {
                        entidade: 'Contrato',
                        entidadeId: contratoAtual.id,
                        acao: 'UPDATE_FINANCEIRO',
                        usuarioId: usuarioId,
                        escolaId,
                        ip: req.ip || null,
                        dadosAntigos: JSON.parse(JSON.stringify({
                            valorMensalidadeBase: contratoAtual.valorMensalidadeBase,
                            descontoMensalidade: contratoAtual.descontoMensalidade,
                            diaVencimento: contratoAtual.diaVencimento
                        })),
                        dadosNovos: JSON.parse(JSON.stringify({
                            valorMensalidadeBase: Number(valorMensalidadeBase),
                            descontoMensalidade: Number(descontoMensalidade),
                            diaVencimento: Number(diaVencimento),
                            atividadesExtras,
                            boletosCancelados: boletosParaCancelar.length,
                            boletosGerados: boletosGerados.length
                        }))
                    }
                });
                return {
                    contrato: contratoAtualizado,
                    sumario: {
                        cancelados: boletosParaCancelar.length,
                        gerados: boletosGerados.length
                    }
                };
            });
            return res.status(200).json({
                message: 'Repactuação financeira e regeneração de boletos concluídas com sucesso.',
                data: resultado
            });
        }
        catch (error) {
            console.error('[UpdateFinanceiro Critical Error]:', error);
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(error.message || 'Erro ao processar repactuação financeira.', 500);
        }
    },
    /**
     * POST /contratos/:id/reativar
     * Reativa um contrato suspenso, realoca o aluno em uma turma e gera boletos futuros.
     */
    async reativarContrato(req, res) {
        const { id } = req.params;
        const { turmaId } = req.body;
        const escolaId = req.user?.escolaId;
        const usuarioId = req.user?.userId;
        if (!escolaId) {
            throw new errorHandler_1.AppError('Escola não identificada no contexto de autenticação', 403);
        }
        const resultado = await prisma_1.prisma.$transaction(async (tx) => {
            const hoje = new Date();
            // 1. Buscar contrato e validar se está suspenso
            const contratoAtual = await tx.contrato.findFirst({
                where: { id: id, escolaId, status: 'SUSPENSO' },
                include: {
                    aluno: {
                        include: {
                            atividadesExtra: {
                                where: { ativo: true },
                                include: { atividadeExtra: true }
                            }
                        }
                    }
                }
            });
            if (!contratoAtual) {
                throw new errorHandler_1.AppError('Contrato suspenso não encontrado ou já está ativo.', 404);
            }
            // 2. Validar se a nova turma existe na escola
            const turmaAlvo = await tx.turma.findFirst({
                where: { id: turmaId, escolaId }
            });
            if (!turmaAlvo) {
                throw new errorHandler_1.AppError('Turma de realocação não encontrada nesta escola.', 404);
            }
            // 3. Atualizar Contrato (Limpar dataFim e reativar flags)
            const contratoAtivado = await tx.contrato.update({
                where: { id: contratoAtual.id },
                data: {
                    status: 'ATIVO',
                    ativo: true,
                    dataFim: null
                }
            });
            // 4. Vincular Aluno à nova Turma
            await tx.aluno.update({
                where: { id: contratoAtual.alunoId },
                data: { turmaId }
            });
            // 5. Gerar novos boletos para os meses restantes até Dezembro
            const valorAtividades = contratoAtual.aluno.atividadesExtra.reduce((acc, item) => {
                return acc + (Number(item.atividadeExtra.valor) || 0);
            }, 0);
            // Cálculo da Mensalidade Líquida (Base - Desconto)
            const valorBaseNet = Number(contratoAtual.valorMensalidadeBase) - (Number(contratoAtual.descontoMensalidade) || 0);
            const valorTotal = valorBaseNet + valorAtividades;
            const mesAtual = hoje.getMonth() + 1;
            const anoAtual = hoje.getFullYear();
            const boletosGerados = [];
            for (let m = mesAtual; m <= 12; m++) {
                // Verifica se já existe um boleto ativo para evitar duplicidade na reativação
                const existe = await tx.boletos.findFirst({
                    where: {
                        alunoId: contratoAtual.alunoId,
                        mesReferencia: m,
                        anoReferencia: anoAtual,
                        status: { not: 'CANCELADO' },
                        deletedAt: null
                    }
                });
                if (existe)
                    continue;
                const referencia = `${String(m).padStart(2, '0')}/${anoAtual}`;
                const dataVencimento = new Date(anoAtual, m - 1, contratoAtual.diaVencimento);
                const novoBoleto = await tx.boletos.create({
                    data: {
                        alunoId: contratoAtual.alunoId,
                        escolaId,
                        referencia,
                        mesReferencia: m,
                        anoReferencia: anoAtual,
                        valorBase: valorBaseNet,
                        valorAtividades,
                        valorTotal,
                        dataVencimento,
                        status: 'PENDENTE',
                        descricao: `Mensalidade Escolar (Reativada) - Ref: ${referencia}`
                    }
                });
                boletosGerados.push(novoBoleto);
            }
            // 6. Gravar Auditoria
            await tx.logAuditoria.create({
                data: {
                    entidade: 'Contrato',
                    entidadeId: contratoAtual.id,
                    acao: 'REATIVACAO_CONTRATO',
                    usuarioId: usuarioId,
                    escolaId,
                    ip: req.ip || null,
                    dadosNovos: JSON.parse(JSON.stringify({
                        turmaId,
                        boletosGerados: boletosGerados.length
                    }))
                }
            });
            return {
                contrato: contratoAtivado,
                boletosGerados: boletosGerados.length,
                turma: turmaAlvo.nome
            };
        });
        return res.status(200).json({
            message: 'Contrato reativado, aluno enturmado e cobranças geradas com sucesso.',
            data: resultado
        });
    },
};
//# sourceMappingURL=contratoController.js.map