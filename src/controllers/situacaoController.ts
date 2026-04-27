import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';
import { getRequiredEscolaId } from '../utils/context';

export const situacaoController = {

  /**
   * GET /situacao
   * Lista o contas a receber (Boletos) da instituição
   */
  async list(req: Request, res: Response) {
    const { page = 1, limit = 20, alunoId, status, busca } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    let where: any = {};
    if (alunoId) where.alunoId = alunoId;
    if (status) where.status = status;

    if (busca) {
      where.OR = [
        { referencia: { contains: String(busca), mode: 'insensitive' } },
        { aluno: { nome: { contains: String(busca), mode: 'insensitive' } } }
      ];
    }

    // A extensão Prisma garante o isolamento por tenant e o soft delete
    const [boletos, total] = await Promise.all([
      prisma.boletos.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          aluno: {
            select: { id: true, nome: true, numeroMatricula: true, turma: { select: { nome: true } } }
          },
          transacao: { select: { id: true, data: true } }
        },
        orderBy: { dataVencimento: 'asc' },
      }),
      prisma.boletos.count({ where }),
    ]);

    return res.json({
      status: 'success',
      data: boletos,
      meta: { total, page: Number(page), limit: Number(limit) }
    });
  },

  /**
   * POST /situacao/:id/pagar
   * Registra o pagamento do boleto e atualiza o Livro Caixa
   */
  async registrarPagamento(req: Request, res: Response) {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const { dataPagamento, valorPago, formaPagamento, observacoes } = req.body;
    const escolaId = getRequiredEscolaId();
    const usuarioId = req.user?.userId;

    const boleto = await prisma.boletos.findFirst({
      where: { id },
      include: { aluno: true }
    });

    if (!boleto) throw new AppError('Boleto não encontrado', 404);
    if (boleto.status === 'PAGO') throw new AppError('Este boleto já consta como pago.', 400);

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Gera a Transação Financeira Global (Entrada no Caixa)
      const transacao = await tx.transacao.create({
        data: {
          tipo: 'ENTRADA',
          valor: valorPago,
          motivo: `Recebimento: Ref ${boleto.referencia} - Aluno: ${boleto.aluno.nome}`,
          observacao: observacoes || `Pagamento registrado via secretaria.`,
          data: dataPagamento,
          formaPagamento,
          escolaId // Inject explícito na tx se necessário
        }
      });

      // 2. Liquida o Boleto e vincula a transação
      const boletoAtualizado = await tx.boletos.update({
        where: { id },
        data: {
          status: 'PAGO',
          dataPagamento,
          valorPago,
          formaPagamento,
          transacaoId: transacao.id, // Vínculo essencial para integridade
          observacoes
        }
      });

      // 3. Auditoria Financeira
      await tx.logAuditoria.create({
        data: {
          entidade: 'Boletos',
          entidadeId: id,
          acao: 'LIQUIDACAO_MENSALIDADE',
          usuarioId: usuarioId || null,
          escolaId,
          dadosNovos: { valorPago, formaPagamento, transacaoId: transacao.id }
        }
      });

      return boletoAtualizado;
    });

    return res.json({ status: 'success', message: 'Pagamento registrado com sucesso no caixa.', data: resultado });
  },

  /**
   * POST /situacao/:id/estorno
   * Invalida o pagamento e cria um lançamento reverso no caixa
   */
  async estornarPagamento(req: Request, res: Response) {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const { motivo } = req.body;
    const escolaId = getRequiredEscolaId();
    const usuarioId = req.user?.userId;

    const boleto = await prisma.boletos.findFirst({
      where: { id },
      include: { aluno: true }
    });

    if (!boleto) throw new AppError('Boleto não encontrado', 404);
    if (boleto.status !== 'PAGO') throw new AppError('Apenas boletos pagos podem ser estornados.', 400);

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Criar Transação de SAÍDA (Compensação para não fraudar o caixa)
      await tx.transacao.create({
        data: {
          tipo: 'SAIDA',
          valor: boleto.valorPago || boleto.valorTotal,
          motivo: `ESTORNO: Ref ${boleto.referencia} - Aluno: ${boleto.aluno.nome}`,
          observacao: `Motivo: ${motivo}`,
          data: new Date(),
          formaPagamento: 'TRANSFERENCIA', // ou o método que foi devolvido
          escolaId
        }
      });

      // 2. Voltar o boleto para o status original (Vencido ou Pendente)
      const dataVenc = new Date(boleto.dataVencimento);
      dataVenc.setHours(0, 0, 0, 0);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const novoStatus = dataVenc < hoje ? 'VENCIDO' : 'PENDENTE';

      const boletoEstornado = await tx.boletos.update({
        where: { id },
        data: {
          status: novoStatus,
          valorPago: null,
          dataPagamento: null,
          formaPagamento: null,
          transacaoId: null, // Quebra o vínculo com a transação de entrada antiga
          observacoes: `Estornado. Motivo: ${motivo}`
        }
      });

      // 3. Auditoria de Estorno
      await tx.logAuditoria.create({
        data: {
          entidade: 'Boletos',
          entidadeId: id,
          acao: 'ESTORNO_MENSALIDADE',
          usuarioId: usuarioId || null,
          escolaId,
          dadosNovos: { status: novoStatus, motivo }
        }
      });

      return boletoEstornado;
    });

    return res.json({ status: 'success', message: 'Pagamento estornado e caixa ajustado.', data: resultado });
  },

  /**
   * GET /situacao/resumo
   * Painel de status financeiro
   */
  async resumoDashboard(req: Request, res: Response) {
    // Delegando a agregação massiva para o Postgres (Alta performance)
    const agrupamento = await prisma.boletos.groupBy({
      by: ['status'],
      _sum: { valorTotal: true },
      _count: { id: true },
      // Extensão aplica o escolaId automaticamente
    });

    // Mapeamento amigável para o frontend
    const resultado = agrupamento.map(item => ({
      status: item.status,
      totalDevido: Number(item._sum.valorTotal || 0).toFixed(2),
      quantidadeBoletos: item._count.id
    }));

    return res.json({ status: 'success', data: resultado });
  }
};