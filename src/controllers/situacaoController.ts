import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'

export const situacaoController = {

  // GET - listar boletos com paginação e filtros
  async list(req: Request, res: Response) {
    const { page = 1, limit = 10, alunoId, status } = req.query as any
    const skip = (Number(page) - 1) * Number(limit)

    let where: any = {
      escolaId: req.user?.escolaId,
    }

    if (alunoId) where.alunoId = alunoId
    if (status) where.status = status

    const [boletos, total] = await Promise.all([
      prisma.boletos.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          aluno: {
            select: {
              id: true,
              nome: true,
              numeroMatricula: true,
              turma: { select: { nome: true } }
            },
          },
        },
        orderBy: { dataVencimento: 'desc' },
      }),
      prisma.boletos.count({ where }),
    ])

    return res.json({
      data: boletos,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      },
    })
  },


  // GET /pagamentos/:id - Obter detalhes de um pagamento específico
  async show(req: Request, res: Response) {
    const id = req.params.id as string;
    const escolaId = req.user?.escolaId;

    const pagamento = await prisma.boletos.findFirst({
      where: {
        id: id,
        aluno: { escolaId } // Garante que o pagamento é da escola do usuário
      },
      include: {
        aluno: {
          include: {
            turma: { select: { nome: true } },
            responsaveis: true
          }
        },
        transacao: true
      }
    });

    if (!pagamento) {
      throw new AppError('Pagamento não encontrado', 404);
    }

    return res.json(pagamento)
  },


  //POST /pagamentos - Criar um novo pagamento
  async create(req: Request, res: Response) {
    const dados = req.body
    const escolaId = req.user?.escolaId;

    const aluno = await prisma.aluno.findFirst({
      where: { id: dados.alunoId, escolaId }
    });

    if (!aluno) {
      throw new AppError('Aluno não encontrado ou não pertence a esta escola', 404);
    }

    const pagamento = await prisma.boletos.create({
      data: {
        ...dados,
        // Caso seu schema use valorTotal e o banco peça valorBase, ajuste aqui:
        valorBase: dados.valorTotal,
        valorTotal: dados.valorTotal,
      }
    });

    return res.status(201).json(pagamento)
  },


  // PUT /pagamentos/:id - Atualizar um pagamento existente
  async update(req: Request, res: Response) {
    const id = req.params.id as string;
    const dados = req.body
    const escolaId = req.user?.escolaId;

    const pagamentoExistente = await prisma.boletos.findFirst({
      where: { id: id, aluno: { escolaId } }
    });

    if (!pagamentoExistente) {
      throw new AppError('Pagamento não encontrado ou acesso negado', 404);
    }

    const pagamento = await prisma.boletos.update({
      where: { id: id },
      data: {
        ...dados,
      },
    })

    return res.json(pagamento)
  },

  // POST /pagamentos/:id/registrar - Registrar pagamento como pago
  async registrarPagamento(req: Request, res: Response) {
    const id = req.params.id as string;
    const { formaPagamento, observacoes } = req.body;
    const escolaId = req.user?.escolaId;
    const usuarioId = req.user?.userId;

    const boleto = await prisma.boletos.findUnique({
      where: { id },
      include: { aluno: true }
    });


    if (!boleto) throw new AppError('Boleto não encontrado', 404)
    if (boleto.status === 'PAGO') throw new AppError('Boleto já foi pago', 400)

    // 2. Executar Transação (Garante integridade financeira)
    const resultado = await prisma.$transaction(async (tx) => {

      // A. Criar o registro na tabela de Transações (Fluxo de Caixa / Auditoria)
      const transacao = await tx.transacao.create({
        data: {
          tipo: 'ENTRADA',
          valor: boleto.valorTotal,
          motivo: 'MENSALIDADE',
          observacao: `Pgto Boleto Ref ${boleto.referencia} - Aluno: ${boleto.aluno.nome}`,
          data: new Date(),
          formaPagamento: formaPagamento,
          escolaId: escolaId as string,
        }
      });

      // B. Atualizar o status do Boleto
      return await tx.boletos.update({
        where: { id },
        data: {
          status: 'PAGO',
          dataPagamento: new Date(),
          valorPago: boleto.valorTotal,
          formaPagamento,
          observacoes,
          transacaoId: transacao.id // Vincula o boleto à transação criada
        }
      });
    });

    return res.json({ message: 'Pagamento registrado com sucesso', data: resultado });
  },

  // POST /pagamentos/:id/cancelar - Cancelar um pagamento - soft delete
  async cancelar(req: Request, res: Response) {
    const id = req.params.id as string;
    const escolaId = req.user?.escolaId;

    const pagamento = await prisma.boletos.findFirst({
      where: {
        id,
        aluno: { escolaId, deletedAt: null },
      },
    })

    if (!pagamento) throw new AppError('Pagamento não encontrado', 404)

    if (pagamento.status === 'PAGO') throw new AppError('Não é possível cancelar pagamento já registrado', 400)

    await prisma.boletos.update({
      where: { id },
      data: { status: 'CANCELADO' },
    })

    return res.json({ message: 'Pagamento cancelado' })
  },

  // GET /pagamentos/inadimplentes - Listar alunos inadimplentes
  async getInadimplentes(req: Request, res: Response) {
    const escolaId = req.user?.escolaId;
    const hoje = new Date()


    const agregacaoInadimplentes = await prisma.boletos.groupBy({
      by: ['alunoId'],
      where: {
        status: 'PENDENTE',
        dataVencimento: { lt: hoje },
      },
      _sum: { valorTotal: true },
      _count: { id: true }
    });

    if (agregacaoInadimplentes.length === 0) {
      return res.json({ totalGeralDevido: 0, quantidadeAlunos: 0, inadimplentes: [] });
    }
    // Alunos inadimplentes detalhados
    const alunosIds = agregacaoInadimplentes.map(item => item.alunoId);

    const detalhesAlunos = await prisma.aluno.findMany({
      where: { id: { in: alunosIds } },
      select: {
        id: true,
        nome: true,
        numeroMatricula: true,
        turma: { select: { nome: true } },
        responsaveis: {
          where: { isResponsavelFinanceiro: true },
          select: { nome: true, telefone1: true, email: true }
        }
      }
    });

    // 3. Montar o retorno final cruzando os dados
    const resultado = agregacaoInadimplentes.map(item => {
      const aluno = detalhesAlunos.find(a => a.id === item.alunoId);
      return {
        aluno: {
          id: aluno?.id,
          nome: aluno?.nome,
          matricula: aluno?.numeroMatricula,
          turma: aluno?.turma?.nome
        },
        responsavel: aluno?.responsaveis[0] || null,
        totalDevido: item._sum.valorTotal,
        quantidadeBoletos: item._count.id
      };
    });


    return res.json(resultado);
  },
}