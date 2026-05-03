import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withTenancy, withEscolaId } from '../utils/prismaHelpers'

// Listar contratos
export const contratoController = {
  /**
   * GET /contratos - Listagem Multi-tenant
   */
  async list(req: Request, res: Response) {
    const { page = 1, limit = 20, status, alunoId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (alunoId) where.alunoId = alunoId;

    // A extensão Prisma injetará escolaId automaticamente aqui
    const [contratos, total] = await Promise.all([
      prisma.contrato.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          aluno: { select: { id: true, nome: true, numeroMatricula: true } },
          responsavelFinanceiro: { select: { id: true, nome: true, cpf: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contrato.count({ where }),
    ]);

    return res.json({
      status: 'success',
      data: contratos,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit)),
      },
    });
  },

  /**
   * GET /contratos/:id - Detalhes
   */
  async show(req: Request, res: Response) {
    const { id } = req.params;
    const idFormatado = Array.isArray(id) ? id[0] : id;

    const contrato = await prisma.contrato.findFirst({
      where: { id: idFormatado },
      include: {
        aluno: true,
        responsavelFinanceiro: true,
        transacoes: { take: 5, orderBy: { data: 'desc' } }
      }
    });

    if (!contrato) throw new AppError('Contrato não encontrado.', 404);

    return res.json({ status: 'success', data: contrato });
  },

  /**
   * POST /contratos - Criação vinculada
   */
  async create(req: Request, res: Response) {
    const dados = req.body;

    // Verifica se o aluno já possui um contrato (Unicidade @unique alunoId)
    const contratoExistente = await prisma.contrato.findFirst({
      where: { alunoId: dados.alunoId }
    });

    if (contratoExistente) {
      throw new AppError('Este aluno já possui um contrato cadastrado. Use a atualização ou cancele o anterior.', 400);
    }

    const novoContrato = await prisma.contrato.create({
      data: dados // escolaId injetado automaticamente
    });

    return res.status(201).json({ status: 'success', data: novoContrato });
  },

  /**
     * PUT /contratos/:id - Atualização com Auditoria
     */
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const idFormatado = Array.isArray(id) ? id[0] : id;
    const dados = req.body;

    const contrato = await prisma.contrato.findFirst({ where: { id: idFormatado } });
    if (!contrato) throw new AppError('Contrato não encontrado.', 404);

    const atualizado = await prisma.contrato.update({
      where: { id: idFormatado },
      data: dados
    });

    return res.json({
      status: 'success',
      message: 'Contrato atualizado com sucesso.',
      data: atualizado
    });
  },

  // Cancelar um contrato
  async cancelar(req: Request, res: Response) {
    const dados = req.body
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id
    const isStatus = dados.status ? dados.status : 'CANCELADO'

    const contrato = await prisma.contrato.findFirst({
      where: {
        id: idFormatado,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
    })
    if (!contrato) throw new AppError('Contrato não encontrado', 404)

    const contratoAtualizado = await prisma.contrato.update({
      where: { id: idFormatado },
      data: {
        status: isStatus,
        dataFim: new Date(),
      },
    })

    return res.json(contratoAtualizado)
  },

  /**
   * POST /contratos/:id/suspender
   * Suspende o contrato, cancela boletos futuros pendentes e gera auditoria.
   */
  async suspender(req: Request, res: Response) {
    const { id } = req.params
    const { motivo } = req.body
    const escolaId = req.user?.escolaId

    if (!escolaId) {
      throw new AppError('Escola ID não encontrado no contexto de autenticação', 400)
    }

    // 1. Busca contrato atual para validar posse e guardar snapshot para auditoria
    const contratoAtual = await prisma.contrato.findFirst({
      where: {
        id: id as string,
        escolaId, // Regra de Ouro: Multi-tenant
        ativo: true, // Só processa se estiver ativo
      },
      include: {
        aluno: { select: { id: true, nome: true } }
      }
    })

    if (!contratoAtual) {
      throw new AppError('Contrato não encontrado, não pertence à escola ou já está inativo.', 404)
    }

    if (contratoAtual.status === 'SUSPENSO') {
      throw new AppError('Este contrato já se encontra suspenso.', 400)
    }

    // 2. Transação Atômica (Prisma v7+)
    const resultado = await prisma.$transaction(async (tx) => {
      const hoje = new Date()

      // A. Atualiza o Contrato
      const contratoSuspenso = await tx.contrato.update({
        where: { id: contratoAtual.id },
        data: {
          status: 'SUSPENSO',
          ativo: false,
          dataFim: hoje
        }
      })

      // B. Cancela os Boletos (Imutabilidade Financeira)
      const notaCancelamento = motivo
        ? `Cancelado por suspensão de contrato. Motivo: ${motivo}`
        : 'Cancelado por suspensão de contrato.'

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
      })

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
      })

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
      }
    })

    return res.status(200).json({
      message: 'Contrato suspenso com sucesso.',
      data: resultado
    })
  },

  /**
   * PATCH /contratos/:id/financeiro
   * Realiza a repactuação financeira do contrato.
   * Cancela boletos pendentes futuros e gera novos registros baseados nos novos termos.
   */
  async updateFinanceiro(req: Request, res: Response) {
    const { id } = req.params;
    const idFormatado = Array.isArray(id) ? id[0] : id;
    const { valorMensalidadeBase, descontoMensalidade, diaVencimento, mesesFaturamento, atividadesExtras } = req.body;
    const escolaId = req.user?.escolaId;
    const usuarioId = req.user?.userId;

    if (!escolaId) throw new AppError('Escola não identificada no contexto.', 403);

    const resultado = await prisma.$transaction(async (tx) => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const contratoAtual = await tx.contrato.findFirst({
        where: { id: idFormatado, escolaId },
      });

      if (!contratoAtual || contratoAtual.status === 'CANCELADO') {
        throw new AppError('Contrato não encontrado ou já encontra-se cancelado.', 404);
      }

      // 1. Atualiza o Blueprint do Contrato (incluindo a nova matriz de meses)
      const contratoAtualizado = await tx.contrato.update({
        where: { id: contratoAtual.id },
        data: {
          valorMensalidadeBase,
          descontoMensalidade,
          diaVencimento,
          mesesFaturamento // O Contrato recebe a nova matriz de repactuação
        }
      });

      // 2. Repactuação de Atividades Extras
      await tx.alunoAtividadeExtra.deleteMany({
        where: { alunoId: contratoAtual.alunoId }
      });

      if (atividadesExtras?.length > 0) {
        const itensParaCriar = atividadesExtras.filter((item: any) => item.ativo).map((item: any) => ({
          alunoId: contratoAtual.alunoId,
          atividadeExtraId: item.atividadeExtraId,
          ativo: true,
          dataInicio: hoje,
          escolaId,
        }));
        if (itensParaCriar.length > 0) await tx.alunoAtividadeExtra.createMany({ data: itensParaCriar });
      }

      const atividadesVigor = await tx.alunoAtividadeExtra.findMany({
        where: { alunoId: contratoAtual.alunoId, ativo: true },
        include: { atividadeExtra: { select: { valor: true } } }
      });
      const valorTotalAtividades = atividadesVigor.reduce((acc, item) => acc + (Number(item.atividadeExtra.valor) || 0), 0);
      const novoValorTotalBoleto = Number(valorMensalidadeBase) + valorTotalAtividades - Number(descontoMensalidade);

      // 3. Cancela APENAS boletos pendentes futuros do livro caixa
      const boletosParaCancelar = await tx.boletos.findMany({
        where: {
          alunoId: contratoAtual.alunoId,
          status: 'PENDENTE',
          dataVencimento: { gte: hoje },
          escolaId
        }
      });

      if (boletosParaCancelar.length > 0) {
        await tx.boletos.updateMany({
          where: { id: { in: boletosParaCancelar.map(b => b.id) } },
          data: { status: 'CANCELADO', observacoes: 'Cancelamento por repactuação financeira.' }
        });
      }

      // 4. Geração Estrita baseada na Nova Matriz (Sem saltos cegos para Dezembro)
      const boletosGerados = [];
      const mesAtualNum = hoje.getMonth() + 1;
      const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      for (const mesAtual of mesesFaturamento) {
        // Regra de Negócio: Não regerar boletos para meses passados em uma repactuação
        if (mesAtual < mesAtualNum) continue;

        const existe = await tx.boletos.findFirst({
          where: {
            alunoId: contratoAtual.alunoId,
            mesReferencia: mesAtual,
            anoReferencia: contratoAtual.anoFaturamento,
            status: { in: ['PAGO', 'VENCIDO'] as any },
            escolaId
          }
        });

        if (existe) continue;

        const referencia = `${mesesNomes[mesAtual - 1]}/${contratoAtual.anoFaturamento}`;
        const dataVencimentoNovo = new Date(Date.UTC(contratoAtual.anoFaturamento, mesAtual - 1, diaVencimento, 12, 0, 0));
        
        if (dataVencimentoNovo.getUTCMonth() !== (mesAtual - 1)) dataVencimentoNovo.setUTCDate(0);

        const novoBoleto = await tx.boletos.create({
          data: {
            alunoId: contratoAtual.alunoId,
            escolaId,
            mesReferencia: mesAtual,
            anoReferencia: contratoAtual.anoFaturamento,
            valorBase: Number(valorMensalidadeBase),
            valorAtividades: valorTotalAtividades,
            valorTotal: novoValorTotalBoleto,
            dataVencimento: dataVencimentoNovo,
            status: 'PENDENTE',
            descricao: `${referencia}`
          }
        });
        boletosGerados.push(novoBoleto);
      }

      await tx.logAuditoria.create({
        data: {
          entidade: 'Contrato',
          entidadeId: contratoAtual.id,
          acao: 'UPDATE_FINANCEIRO',
          usuarioId: usuarioId!,
          escolaId,
          dadosAntigos: JSON.parse(JSON.stringify({ matrizAnterior: contratoAtual.mesesFaturamento })),
          dadosNovos: JSON.parse(JSON.stringify({ matrizNova: mesesFaturamento, boletosGerados: boletosGerados.length }))
        }
      });

      return { contrato: contratoAtualizado, sumario: { cancelados: boletosParaCancelar.length, gerados: boletosGerados.length } };
    });

    return res.status(200).json({ message: 'Repactuação concluída.', data: resultado });
  },

  /**
   * POST /contratos/:id/reativar
   * Reativa e gera boletos lendo a matriz gravada no Contrato.
   */
  async reativarContrato(req: Request, res: Response) {
    const { id } = req.params;
    const { turmaId } = req.body;
    const escolaId = req.user?.escolaId;
    const usuarioId = req.user?.userId;

    if (!escolaId) throw new AppError('Escola não identificada', 403);

    const resultado = await prisma.$transaction(async (tx) => {
      const hoje = new Date();

      const contratoAtual = await tx.contrato.findFirst({
        where: { id: id as string, escolaId, status: 'SUSPENSO' },
        include: { aluno: { include: { atividadesExtra: { where: { ativo: true }, include: { atividadeExtra: true } } } } }
      });

      if (!contratoAtual) throw new AppError('Contrato suspenso não encontrado.', 404);

      const turmaAlvo = await tx.turma.findFirst({ where: { id: turmaId, escolaId } });
      if (!turmaAlvo) throw new AppError('Turma não encontrada.', 404);

      const contratoAtivado = await tx.contrato.update({
        where: { id: contratoAtual.id },
        data: { status: 'ATIVO', ativo: true, dataFim: null }
      });

      await tx.aluno.update({
        where: { id: contratoAtual.alunoId },
        data: { turmaId }
      });

      const valorAtividades = contratoAtual.aluno.atividadesExtra.reduce((acc, item) => acc + (Number(item.atividadeExtra.valor) || 0), 0);
      const valorBaseNet = Number(contratoAtual.valorMensalidadeBase) - (Number(contratoAtual.descontoMensalidade) || 0);
      const valorTotal = valorBaseNet + valorAtividades;

      const mesAtualNum = hoje.getMonth() + 1;
      const boletosGerados = [];
      const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      // Loop iterando APENAS sobre o blueprint do Contrato
      for (const mesAtual of contratoAtual.mesesFaturamento) {
        if (mesAtual < mesAtualNum) continue; // Não fatura retroativo na reativação

        const existe = await tx.boletos.findFirst({
          where: {
            alunoId: contratoAtual.alunoId,
            mesReferencia: mesAtual,
            anoReferencia: contratoAtual.anoFaturamento,
            status: { not: 'CANCELADO' },
            escolaId
          }
        });

        if (existe) continue;

        const referencia = `${mesesNomes[mesAtual - 1]}/${contratoAtual.anoFaturamento}`;
        const dataVencimento = new Date(Date.UTC(contratoAtual.anoFaturamento, mesAtual - 1, contratoAtual.diaVencimento, 12, 0, 0));
        
        if (dataVencimento.getUTCMonth() !== (mesAtual - 1)) dataVencimento.setUTCDate(0);

        const novoBoleto = await tx.boletos.create({
          data: {
            alunoId: contratoAtual.alunoId,
            escolaId,
            mesReferencia: mesAtual,
            anoReferencia: contratoAtual.anoFaturamento,
            valorBase: valorBaseNet,
            valorAtividades,
            valorTotal,
            dataVencimento,
            status: 'PENDENTE',
            descricao: `${referencia}`
          }
        });
        boletosGerados.push(novoBoleto);
      }

      await tx.logAuditoria.create({
        data: {
          entidade: 'Contrato',
          entidadeId: contratoAtual.id,
          acao: 'REATIVACAO_CONTRATO',
          usuarioId: usuarioId!,
          escolaId,
          dadosNovos: JSON.parse(JSON.stringify({ turmaId, boletosGerados: boletosGerados.length }))
        }
      });

      return { contrato: contratoAtivado, boletosGerados: boletosGerados.length, turma: turmaAlvo.nome };
    });

    return res.status(200).json({ message: 'Contrato reativado.', data: resultado });
  },
}