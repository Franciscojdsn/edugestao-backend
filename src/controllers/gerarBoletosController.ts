import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

export const gerarBoletosController = {
  /**
   * POST /contratos/:contratoId/gerar-boletos
   * Motor Atômico de Geração Recorrente (Seguro e Isolado contra Race Conditions)
   */
  async gerar(req: Request, res: Response) {
    const { contratoId: idParam } = req.params;
    const contratoId = Array.isArray(idParam) ? idParam[0] : idParam;
    const { mesesFaturamento, anoReferencia } = req.body;

    // Orquestração atômica interna
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Busca do Blueprint Financeiro (O Contrato)
      const contrato = await tx.contrato.findUniqueOrThrow({
        where: { id: String(contratoId) },
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
      }).catch(() => {
        throw new AppError('Contrato não encontrado ou inativo.', 404);
      });

      if (!contrato.ativo) {
        throw new AppError('Acesso Negado: Contrato inativo.', 403);
      }

      // 2. Verificação de Concorrência Lógica (Race Condition Barrier)
      const cobrancasExistentes = await tx.boletos.count({
        where: {
          alunoId: contrato.alunoId,
          anoReferencia,
          mesReferencia: { in: mesesFaturamento }
        }
      });

      if (cobrancasExistentes > 0) {
        throw new AppError('Gargalo de Concorrência: Já existem cobranças emitidas para o período especificado.', 409);
      }

      // Cálculo de valores omitido/mantido conforme regra de negócio interna...
      // Substituir a constante 'boletosParaCriar' pelos seus mapeamentos de negócio
      const boletosParaCriar = mesesFaturamento.map((mes: number) => ({
        alunoId: contrato.alunoId,
        mesReferencia: mes,
        anoReferencia,
        valorBase: contrato.valorMensalidadeBase,
        valorAtividades: 0, // Deve incorporar lógica de atividadesExtras se necessário
        valorTotal: contrato.valorMensalidadeBase,
        status: 'PENDENTE'
      }));

      try {
        await tx.boletos.createMany({ data: boletosParaCriar });
      } catch (error: any) {
        // Intercepta a quebra de constraint única (contratoId + mesRef + anoRef) do Postgres
        if (error.code === 'P2002') {
          throw new AppError('Conflito de Faturamento: Detecção de requisição concorrente.', 409);
        }
        throw error;
      }

      return { count: boletosParaCriar.length };
    });

    return res.status(201).json({ status: 'success', data: resultado });
  },

  async gerarAvulso(req: Request, res: Response) {
    const dados = req.body;

    const aluno = await prisma.aluno.findUnique({
      where: { id: dados.alunoId }
    });

    if (!aluno) throw new AppError('Aluno não encontrado.', 404);

    const dVenc = new Date(dados.dataVencimento);
    const mRef = dVenc.getUTCMonth() + 1;
    const aRef = dVenc.getUTCFullYear();

    const novoBoleto = await prisma.boletos.create({
      data: {
        alunoId: dados.alunoId,
        escolaId: aluno.escolaId,
        mesReferencia: mRef,
        anoReferencia: aRef,
        dataVencimento: dVenc,
        valorBase: dados.valor,
        valorAtividades: 0,
        valorTotal: dados.valor,
        status: 'PENDENTE',
        // Injeção de tenant é feita automaticamente pela extensão do Prisma
      }
    });

    return res.status(201).json({ status: 'success', data: novoBoleto });
  }
};