import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

export const funcionarioController = {
  /**
   * GET /funcionarios
   */
  async list(req: Request, res: Response) {
    const { page = 1, limit = 20, cargo, busca } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (cargo) where.cargo = cargo;
    if (busca) {
      where.OR = [
        { nome: { contains: String(busca), mode: 'insensitive' } },
        { cpf: { contains: String(busca) } },
      ];
    }

    // A extensão garante que `escolaId` e `deletedAt: null` sejam aplicados
    const [funcionarios, total] = await Promise.all([
      prisma.funcionario.findMany({
        where,
        skip,
        take: Number(limit),
        include: { _count: { select: { turmas: true } } },
        orderBy: { nome: 'asc' },
      }),
      prisma.funcionario.count({ where }),
    ]);

    return res.json({ status: 'success', data: funcionarios, meta: { total, page: Number(page) } });
  },

  /**
   * POST /funcionarios
   */
  async create(req: Request, res: Response) {
    const dados = req.body;

    // 1. Validação de Unicidade Multi-tenant
    const cpfExistente = await prisma.funcionario.findFirst({
      where: { cpf: dados.cpf }
    });

    if (cpfExistente) {
      throw new AppError('CPF já cadastrado para outro funcionário nesta instituição.', 400);
    }

    // 2. Criação com Nested Write Seguro
    const funcionario = await prisma.funcionario.create({
      data: {
        escolaId: req.user?.escolaId as string,
        nome: dados.nome,
        cpf: dados.cpf,
        rg: dados.rg,
        dataNascimento: dados.dataNascimento,
        cargo: dados.cargo,
        salarioBase: dados.salarioBase,
        telefone: dados.telefone,
        email: dados.email,
        enderecoId: dados.enderecoId,
        
        // A Prisma Extension cuidará do escolaId no nível pai,
        // mas para aninhados em algumas versões do Prisma é seguro mapear:
        dadosBancarios: dados.dadosBancarios ? {
          create: {
            ...dados.dadosBancarios,
            escolaId: req.user?.escolaId // Garantia extra no aninhado
          }
        } : undefined
      }
    });

    return res.status(201).json({ status: 'success', data: funcionario });
  },

  /**
   * POST /funcionarios/:id/pagamentos
   * Registra a folha salarial com vínculo ao caixa (Lancamento)
   */
  async registrarPagamento(req: Request, res: Response) {
    const { id } = req.params;
    const idFormatado = Array.isArray(id) ? id[0] : id;
    const dados = req.body;
    const escolaId = req.user?.escolaId as string;

    const funcionario = await prisma.funcionario.findFirst({ where: { id: idFormatado } });
    if (!funcionario) throw new AppError('Funcionário não encontrado', 404);

    const valorLiquido = Number(funcionario.salarioBase) + dados.salarioAcrescimos - dados.salarioDesconto;

    // TRANSAÇÃO ATÔMICA
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Registra no Caixa (Livro Caixa global)
      const lancamento = await tx.lancamento.create({
        data: {
          tipo: 'SAIDA',
          descricao: `Pagamento de Salário - ${funcionario.nome} (Ref: ${dados.mesReferencia}/${dados.anoReferencia})`,
          valor: valorLiquido,
          dataVencimento: new Date(),
          dataLiquidacao: new Date(),
          status: 'PAGO',
          categoria: 'FOLHA_PAGAMENTO',
          escolaId // Inject explícito na tx se a extensão não capturar contexto
        }
      });

      // 2. Registra o recibo (Holerite)
      const pagamento = await tx.pagamentoSalario.create({
        data: {
          funcionarioId: funcionario.id,
          lancamentoId: lancamento.id,
          mesReferencia: dados.mesReferencia,
          anoReferencia: dados.anoReferencia,
          salarioBase: funcionario.salarioBase,
          salarioAcrescimos: dados.salarioAcrescimos,
          salarioDesconto: dados.salarioDesconto,
          valorLiquido: valorLiquido,
          formaPagamento: dados.formaPagamento,
          observacoes: dados.observacoes,
          status: 'PAGO',
          escolaId
        }
      });

      return pagamento;
    });

    return res.status(201).json({ status: 'success', data: resultado });
  },

  /**
   * DELETE /funcionarios/:id - Soft delete com travas
   */
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const idFormatado = Array.isArray(id) ? id[0] : id;

    const funcionario = await prisma.funcionario.findFirst({
      where: { id: idFormatado },
      include: { _count: { select: { turmas: true } } }
    });

    if (!funcionario) throw new AppError('Funcionário não encontrado', 404);

    // Proteção Acadêmica
    if (funcionario._count.turmas > 0) {
      throw new AppError('Desvincule o professor das turmas ativas antes de realizar a demissão.', 403);
    }

    await prisma.funcionario.update({
      where: { id: idFormatado },
      data: { 
        deletedAt: new Date(),
        statusFuncionario: 'DEMITIDO',
        dataDemissao: new Date()
      }
    });

    return res.status(204).send();
  }
};
