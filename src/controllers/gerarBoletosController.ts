import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'

export const gerarBoletosController = {
  /**
   * POST /contratos/:contratoId/gerar-boletos
   * Gera as cobranças mensais somando Contrato + Atividades Extras
   */
  async gerar(req: Request, res: Response) {
    const contratoId = req.params.contratoId as string;
    const { meses = 1, mesInicio, anoInicio } = req.body;
    const escolaId = req.user?.escolaId;

    // 1. Buscar contrato com dados do aluno e atividades extras ATIVAS
    const contrato = await prisma.contrato.findFirst({
      where: {
        id: contratoId,
        aluno: { escolaId, deletedAt: null },
        ativo: true,
      },
      include: {
        aluno: {
          include: {
            atividadesExtra: {
              include: { atividadeExtra: true }
            }
          }
        }
      }
    });

    if (!contrato) throw new AppError('Contrato não encontrado ou inativo', 404);

    const boletosGerados = [];

    // 2. Loop para gerar os meses solicitados
    for (let i = 0; i < meses; i++) {
      const dataReferencia = new Date(anoInicio, (mesInicio - 1) + i, 1);
      const mes = dataReferencia.getMonth() + 1;
      const ano = dataReferencia.getFullYear();
      const referencia = `${String(mes).padStart(2, '0')}/${ano}`;

      const valorBase = Number(contrato.valorMensalidade); // Decimal do Prisma
      const valorDesconto = Number(contrato.valorDesconto || 0);


      const valorAtividades = contrato.aluno.atividadesExtra.reduce((acc, item) => {
        return acc + (Number(item.atividadeExtra.valor) || 0);
      }, 0);

      const valorTotal = (valorBase + valorAtividades) - valorDesconto;

      const dataVencimento = new Date(ano, mes - 1, contrato.diaVencimento);

      // 4. Criar o registro de Pagamento (Boleto)
      const novoBoleto = await prisma.boletos.create({
        data: {
          aluno: { connect: { id: contrato.alunoId } },
          escola: { connect: { id: escolaId } },
          referencia,
          mesReferencia: mes,
          anoReferencia: ano,
          valorBase,
          valorAtividades,
          valorTotal,
          dataVencimento,
          status: 'PENDENTE',
        }
      });
      boletosGerados.push(novoBoleto);
    }

    return res.status(201).json({
      message: `${boletosGerados.length} boleto(s) gerado(s) com sucesso.`,
      data: boletosGerados
    });
  }
}