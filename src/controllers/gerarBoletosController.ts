import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

export const gerarBoletosController = {
  /**
   * POST /contratos/:contratoId/gerar-boletos
   * Motor Atômico de Geração Recorrente
   */
  async gerar(req: Request, res: Response) {
    const { contratoId } = req.params;
    const { meses, mesInicio, anoInicio } = req.body;

    // 1. Busca Segura via Extensão Prisma (O escolaId é garantido nos bastidores)
    const contrato = await prisma.contrato.findFirst({
      where: { 
        id: String(contratoId),
        ativo: true
      },
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

    if (!contrato) throw new AppError('Contrato não encontrado ou inativo.', 404);

    // 2. Cálculo dos Valores (Anti-fraude: Feito 100% no servidor)
    const valorBaseNet = Number(contrato.valorMensalidadeBase) - Number(contrato.descontoMensalidade);
    
    const valorAtividades = contrato.aluno.atividadesExtra.reduce((acc, curr) => {
      return acc + Number(curr.atividadeExtra.valor);
    }, 0);

    const valorTotal = valorBaseNet + valorAtividades;

    // 3. Transação Atômica: Se falhar em 1 mês, cancela todos.
    const resultado = await prisma.$transaction(async (tx) => {
      const promessasBoletos = [];

      for (let i = 0; i < meses; i++) {
        // Cálculo seguro de data que previne o bug da "Virada de Mês Longo"
        // Exemplo: Janeiro tem dia 31, Fevereiro não. 
        const dataReferencia = new Date(anoInicio, (mesInicio - 1) + i, 1);
        const m = dataReferencia.getMonth() + 1;
        const anoAtual = dataReferencia.getFullYear();
        
        const referencia = `${String(m).padStart(2, '0')}/${anoAtual}`;
        
        // Evitando o bug do dia 31 em meses curtos
        const dataVencimento = new Date(anoAtual, m - 1, contrato.diaVencimento);
        if (dataVencimento.getMonth() !== (m - 1)) {
          // Se "pulou" de mês, retrocede para o último dia do mês desejado
          dataVencimento.setDate(0); 
        }

        // Verifica se já existe um boleto para este mês/ano e aluno (Prevenção de duplicidade)
        const existe = await tx.boletos.findFirst({
          where: {
            alunoId: contrato.alunoId,
            mesReferencia: m,
            anoReferencia: anoAtual,
            status: { not: 'CANCELADO' }
          }
        });

        if (existe) continue; // Pula o mês para não gerar cobrança duplicada

        promessasBoletos.push(
          tx.boletos.create({
            data: {
              escolaId: contrato.escolaId, // Injetado automaticamente pela extensão do Prisma
              alunoId: contrato.alunoId,
              referencia,
              mesReferencia: m,
              anoReferencia: anoAtual,
              valorBase: valorBaseNet,
              valorAtividades,
              valorTotal,
              dataVencimento,
              status: 'PENDENTE',
              descricao: `Mensalidade Escolar - Ref: ${referencia}`
              // escolaId é injetado automaticamente pela extensão do Prisma
            }
          })
        );
      }

      return await Promise.all(promessasBoletos);
    });

    return res.status(201).json({
      status: 'success',
      message: `${resultado.length} boletos foram gerados com sucesso.`,
      data: resultado
    });
  },

  /**
   * POST /boletos/avulso
   * Gera uma cobrança única (Ex: Fardamento, Material, Taxa extra)
   */
  async gerarAvulso(req: Request, res: Response) {
    const dados = req.body;

    const aluno = await prisma.aluno.findFirst({
      where: { id: dados.alunoId }
    });

    if (!aluno) throw new AppError('Aluno não encontrado.', 404);

    const novoBoleto = await prisma.boletos.create({
      data: {
        escolaId: aluno.escolaId, // Injetado automaticamente pela extensão do Prisma
        alunoId: dados.alunoId,
        referencia: dados.referencia,
        mesReferencia: dados.dataVencimento.getMonth() + 1,
        anoReferencia: dados.dataVencimento.getFullYear(),
        valorBase: dados.valorTotal,
        valorAtividades: 0,
        valorTotal: dados.valorTotal,
        dataVencimento: dados.dataVencimento,
        status: 'PENDENTE',
        descricao: dados.descricao,
        observacoes: dados.observacoes
      }
    });

    return res.status(201).json({
      status: 'success',
      message: 'Cobrança avulsa gerada com sucesso.',
      data: novoBoleto
    });
  }
};