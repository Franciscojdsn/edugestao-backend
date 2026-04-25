"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atividadeExtraController = void 0;
const prisma_1 = require("../config/prisma");
const errorHandler_1 = require("../middlewares/errorHandler");
const prismaHelpers_1 = require("../utils/prismaHelpers");
exports.atividadeExtraController = {
    // GET /atividades
    async list(req, res) {
        const atividades = await prisma_1.prisma.atividadeExtra.findMany({
            where: (0, prismaHelpers_1.withEscolaId)({}),
            select: {
                id: true,
                nome: true,
                descricao: true,
                valor: true,
                diaAula: true,
                horario: true,
                capacidadeMaxima: true,
                createdAt: true,
                _count: { select: { alunos: true } },
            },
            orderBy: { nome: 'asc' },
        });
        const atividadesComVagas = atividades.map(a => ({
            ...a,
            totalAlunos: a._count.alunos,
            vagas: a.capacidadeMaxima ? a.capacidadeMaxima - a._count.alunos : null,
        }));
        return res.json({ data: atividadesComVagas, total: atividades.length });
    },
    // GET /atividades/:id
    async show(req, res) {
        const id = req.params;
        const atividade = await prisma_1.prisma.atividadeExtra.findFirst({
            where: (0, prismaHelpers_1.withEscolaId)({ id }),
            include: {
                alunos: {
                    include: {
                        aluno: {
                            select: {
                                id: true,
                                nome: true,
                                numeroMatricula: true,
                                turma: { select: { nome: true } },
                            },
                        },
                    },
                },
                _count: { select: { alunos: true } },
            },
        });
        if (!atividade)
            throw new errorHandler_1.AppError('Atividade não encontrada', 404);
        return res.json(atividade);
    },
    // POST /atividades
    async create(req, res) {
        const escolaId = req.user?.escolaId;
        const dados = req.body;
        // Verificação de duplicidade (já existente no seu código)
        const existe = await prisma_1.prisma.atividadeExtra.findFirst({
            where: { nome: dados.nome, escolaId }
        });
        if (existe)
            throw new errorHandler_1.AppError('Já existe uma atividade com este nome nesta escola', 400);
        const atividade = await prisma_1.prisma.atividadeExtra.create({
            data: {
                nome: dados.nome,
                descricao: dados.descricao,
                valor: Number(dados.valor),
                escolaId: String(escolaId),
                diaAula: dados.diaAula,
                horario: dados.horario,
                capacidadeMaxima: dados.capacidadeMaxima ? Number(dados.capacidadeMaxima) : null,
            }
        });
        return res.status(201).json(atividade);
    },
    // PUT /atividades/:id
    async update(req, res) {
        // CORREÇÃO: Desestruturando para extrair a string exata do ID
        const { id } = req.params;
        const { atualizarBoletosPendentes, ...dados } = req.body;
        const escolaId = req.user?.escolaId;
        const hoje = new Date();
        // 1. Verificar se a atividade existe
        const atividadeExistente = await prisma_1.prisma.atividadeExtra.findFirst({
            where: { id: String(id), escolaId },
        });
        if (!atividadeExistente)
            throw new errorHandler_1.AppError('Atividade não encontrada', 404);
        // 2. Verificar nome duplicado (se houver alteração de nome)
        if (dados.nome && dados.nome !== atividadeExistente.nome) {
            const nomeEmUso = await prisma_1.prisma.atividadeExtra.findFirst({
                where: {
                    nome: dados.nome,
                    escolaId,
                    id: { not: String(id) } // Agora o 'id' é uma string válida para o Prisma
                },
            });
            if (nomeEmUso)
                throw new errorHandler_1.AppError('Nome já está em uso', 400);
        }
        // 3. Atualizar a atividade
        const atividadeAtualizada = await prisma_1.prisma.atividadeExtra.update({
            where: { id: String(id) },
            data: {
                nome: dados.nome,
                descricao: dados.descricao,
                valor: dados.valor !== undefined ? Number(dados.valor) : undefined,
                // Novos campos
                diaAula: dados.diaAula,
                horario: dados.horario,
                capacidadeMaxima: dados.capacidadeMaxima ? Number(dados.capacidadeMaxima) : null,
            }
        });
        // 4. Lógica de Recálculo Financeiro
        if (atualizarBoletosPendentes && dados.valor && Number(dados.valor) !== Number(atividadeExistente.valor)) {
            const boletosParaAtualizar = await prisma_1.prisma.boletos.findMany({
                where: {
                    status: 'PENDENTE',
                    dataVencimento: { gt: hoje },
                    aluno: {
                        atividadesExtra: {
                            some: { atividadeExtraId: String(id) }
                        }
                    }
                },
                include: {
                    aluno: {
                        include: {
                            contrato: { where: { ativo: true } },
                            atividadesExtra: { include: { atividadeExtra: true } }
                        }
                    }
                }
            });
            // Processa cada boleto afetado
            for (const boleto of boletosParaAtualizar) {
                const aluno = boleto.aluno;
                if (!aluno)
                    continue;
                // Tenta pegar o contrato 
                const contrato = Array.isArray(aluno.contrato) ? aluno.contrato : aluno.contrato;
                if (!contrato)
                    continue;
                // Convertendo para número com segurança 
                const valorBase = Number(contrato.valorMensalidadeBase);
                const valorDesconto = Number(contrato.descontoMensalidade || 0);
                const novoValorAtividades = aluno.atividadesExtra.reduce((acc, item) => {
                    const valorItem = item.atividadeExtraId === id
                        ? Number(dados.valor)
                        : Number(item.atividadeExtra.valor);
                    return acc + valorItem;
                }, 0);
                const novoValorTotal = (valorBase + novoValorAtividades) - valorDesconto;
                await prisma_1.prisma.boletos.update({
                    where: { id: boleto.id },
                    data: {
                        valorAtividades: novoValorAtividades,
                        valorTotal: novoValorTotal
                    }
                });
            }
        }
        return res.json(atividadeAtualizada);
    },
    // DELETE /atividades/:id
    async delete(req, res) {
        const { id } = req.params;
        const escolaId = req.user?.escolaId;
        const atividade = await prisma_1.prisma.atividadeExtra.findFirst({
            where: { id: String(id), escolaId },
            include: { _count: { select: { alunos: true } } },
        });
        if (!atividade)
            throw new errorHandler_1.AppError('Atividade não encontrada', 404);
        // CORREÇÃO LINHA 169: Verificação segura
        if (atividade._count && atividade._count.alunos > 0) {
            throw new errorHandler_1.AppError(`Não é possível excluir: existem ${atividade._count.alunos} alunos matriculados.`, 400);
        }
        await prisma_1.prisma.atividadeExtra.delete({ where: { id: String(id) } });
        return res.status(204).send();
    },
    // POST /atividades/:atividadeId/alunos
    async vincularAluno(req, res) {
        // Extração corrigida para bater com a rota
        const { atividadeId } = req.params;
        const { alunoId } = req.body;
        const escolaId = req.user?.escolaId;
        if (!atividadeId || !alunoId) {
            throw new errorHandler_1.AppError('Dados incompletos', 400);
        }
        // 1. Validar Atividade
        const atividade = await prisma_1.prisma.atividadeExtra.findFirst({
            where: { id: String(atividadeId), escolaId },
            include: { _count: { select: { alunos: true } } },
        });
        if (!atividade)
            throw new errorHandler_1.AppError('Atividade não encontrada', 404);
        // 2. Validar Aluno
        const aluno = await prisma_1.prisma.aluno.findFirst({
            where: { id: String(alunoId), escolaId },
        });
        if (!aluno)
            throw new errorHandler_1.AppError('Aluno não encontrado', 404);
        // 3. Verificar Duplicidade
        const vinculoExiste = await prisma_1.prisma.alunoAtividadeExtra.findUnique({
            where: {
                alunoId_atividadeExtraId: {
                    alunoId: String(alunoId),
                    atividadeExtraId: String(atividadeId)
                }
            },
        });
        if (vinculoExiste)
            throw new errorHandler_1.AppError('Aluno já matriculado nesta atividade', 400);
        // 4. Verificar Capacidade
        if (atividade.capacidadeMaxima && atividade._count.alunos >= atividade.capacidadeMaxima) {
            throw new errorHandler_1.AppError('Capacidade máxima atingida', 400);
        }
        // 5. Criar Vínculo
        // CORREÇÃO LINHAS 250-251: Uso explícito das chaves
        const vinculo = await prisma_1.prisma.alunoAtividadeExtra.create({
            data: {
                alunoId: String(alunoId),
                atividadeExtraId: String(atividadeId)
            },
            include: {
                aluno: { select: { nome: true, numeroMatricula: true } },
                atividadeExtra: { select: { nome: true, valor: true } },
            },
        });
        return res.status(201).json(vinculo);
    },
    // DELETE /atividades/:atividadeId/alunos/:alunoId
    async desvincularAluno(req, res) {
        const { atividadeId, alunoId } = req.params;
        // CORREÇÃO LINHA 269: Uso correto da chave composta no Prisma
        const vinculo = await prisma_1.prisma.alunoAtividadeExtra.findUnique({
            where: {
                alunoId_atividadeExtraId: {
                    alunoId: String(alunoId),
                    atividadeExtraId: String(atividadeId)
                }
            },
        });
        if (!vinculo)
            throw new errorHandler_1.AppError('Vínculo não encontrado', 404);
        await prisma_1.prisma.alunoAtividadeExtra.delete({
            where: {
                alunoId_atividadeExtraId: {
                    alunoId: String(alunoId),
                    atividadeExtraId: String(atividadeId)
                }
            },
        });
        return res.status(204).send();
    },
    // GET /atividades/:atividadeId/alunos
    async alunosDaAtividade(req, res) {
        const { atividadeId } = req.params;
        const escolaId = req.user?.escolaId;
        const atividade = await prisma_1.prisma.atividadeExtra.findFirst({
            where: { id: String(atividadeId), escolaId },
        });
        if (!atividade)
            throw new errorHandler_1.AppError('Atividade não encontrada', 404);
        const alunosVinculados = await prisma_1.prisma.alunoAtividadeExtra.findMany({
            where: { atividadeExtraId: String(atividadeId) },
            include: {
                aluno: {
                    select: {
                        id: true,
                        nome: true,
                        numeroMatricula: true,
                        turma: { select: { nome: true } },
                    },
                },
            },
            orderBy: { aluno: { nome: 'asc' } },
        });
        return res.json({
            atividade: { id: atividade.id, nome: atividade.nome },
            alunos: alunosVinculados.map(v => v.aluno),
            total: alunosVinculados.length,
        });
    },
};
//# sourceMappingURL=atividadeExtraController.js.map