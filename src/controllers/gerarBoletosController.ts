import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';
import { getRequiredEscolaId } from '../utils/context'; // Requisito arquitetural de segurança

export const gerarBoletosController = {
  /**
   * POST /contratos/:contratoId/gerar-boletos
   * Motor Atômico de Geração Recorrente (Seguro e Isolado)
   */
  async gerar(req: Request, res: Response) {
    const { contratoId } = req.params;
    const escolaId = getRequiredEscolaId(); // Trava de Tenant

    // 1. Busca do Blueprint Financeiro (O Contrato)
    const contrato = await prisma.contrato.findFirst({
      where: {
        id: Array.isArray(contratoId) ? contratoId[0] : contratoId,
        escolaId,
        ativo: true
      },
      include: {
        aluno: {
          include: {
            atividadesExtra: {
              where: { ativo: true, escolaId },
              include: { atividadeExtra: true }
            }
          }
        }
      }
    });

    if (!contrato) {
      throw new AppError('Acesso Negado: Contrato não encontrado ou inativo.', 404);
    }

    if (!contrato.mesesFaturamento || (Array.isArray(contrato.mesesFaturamento) && contrato.mesesFaturamento.length === 0)) {
      throw new AppError('Inconsistência de Dados: O contrato não possui meses de faturamento definidos.', 400);
    }

    const valorBaseNet = Number(contrato.valorMensalidadeBase) - Number(contrato.descontoMensalidade);
    const valorAtividades = contrato.aluno.atividadesExtra.reduce((acc, curr) => acc + Number(curr.atividadeExtra.valor), 0);
    const valorTotal = valorBaseNet + valorAtividades;

    const resultado = await prisma.$transaction(async (tx) => {
      const boletosParaCriar = [];
      const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      // 2. Iteração segura baseada EXCLUSIVAMENTE no banco de dados
      for (const mesAtual of contrato.mesesFaturamento) {
        const referencia = `${mesesNomes[mesAtual - 1]}/${contrato.anoFaturamento}`;

        const dataVencimento = new Date(Date.UTC(contrato.anoFaturamento, mesAtual - 1, contrato.diaVencimento, 12, 0, 0));

        // Proteção contra meses curtos (Fev 30 -> Fev 28)
        if (dataVencimento.getUTCMonth() !== (mesAtual - 1)) {
          dataVencimento.setUTCDate(0);
        }

        const existe = await tx.boletos.findFirst({
          where: {
            alunoId: contrato.alunoId,
            mesReferencia: mesAtual,
            anoReferencia: contrato.anoFaturamento,
            escolaId,
            status: { not: 'CANCELADO' }
          }
        });

        if (existe) continue;

        boletosParaCriar.push({
          escolaId,
          alunoId: contrato.alunoId,
          mesReferencia: mesAtual,
          anoReferencia: contrato.anoFaturamento,
          valorBase: valorBaseNet,
          valorAtividades,
          valorTotal,
          dataVencimento,
          status: 'PENDENTE' as const,
          descricao: `${referencia}`
        });
      }

      if (boletosParaCriar.length > 0) {
        await tx.boletos.createMany({ data: boletosParaCriar });
      }

      return { count: boletosParaCriar.length };
    });

    return res.status(201).json({ status: 'success', data: resultado });
  },

  /**
   * POST /boletos/avulso
   * Gera uma cobrança única auditável e atrelada ao tenant
   */
  async gerarAvulso(req: Request, res: Response) {
    const dados = req.body;
    const escolaId = getRequiredEscolaId();

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: dados.alunoId,
        escolaId // TRAVA DE SEGURANÇA MULTI-TENANT
      }
    });

    if (!aluno) throw new AppError('Aluno não encontrado no seu ambiente de gestão.', 404);

    const dVenc = new Date(dados.dataVencimento);
    const mRef = dVenc.getUTCMonth() + 1;
    const aRef = dVenc.getUTCFullYear();

    const novoBoleto = await prisma.boletos.create({
      data: {
        escolaId,
        alunoId: dados.alunoId,
        mesReferencia: mRef,
        anoReferencia: aRef,
        valorBase: dados.valorTotal,
        valorAtividades: 0,
        valorTotal: dados.valorTotal,
        dataVencimento: dVenc,
        status: 'PENDENTE',
        descricao: dados.descricao,
        observacoes: dados.observacoes || ''
      }
    });

    return res.status(201).json({
      status: 'success',
      message: 'Cobrança avulsa gerada e registrada com sucesso.',
      data: novoBoleto
    });
  }
};