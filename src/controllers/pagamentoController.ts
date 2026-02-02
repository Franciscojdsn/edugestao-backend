import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withTenancy } from '../utils/prismaHelpers'

export const pagamentoController = {

  // GET - listar pagamentos com paginação e filtros
  async list(req: Request, res: Response) {
    const { page, limit, alunoId, status } = req.query as any
    const skip = (page - 1) * limit

    let where: any = {
      escolaId: req.user?.escolaId,
      deletedAt: null,
    }

    if (alunoId) where.alunoId = alunoId
    if (status) where.status = status

    const [pagamentos, total] = await Promise.all([
      prisma.pagamento.findMany({
        where,
        skip,
        take: limit,
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
        orderBy: { dataVencimento: 'desc' },
      }),
      prisma.pagamento.count({ where }),
    ])

    return res.json({
      data: pagamentos,
      meta: { total, page: page, limit: limit, totalPages: Math.ceil(total / limit) },
    })
  },


  // GET /pagamentos/:id - Obter detalhes de um pagamento específico
  async show(req: Request, res: Response) {
    const  id  = req.params.id as string;
    const escolaId = req.user?.escolaId;

    const pagamento = await prisma.pagamento.findFirst({
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

    const pagamento = await prisma.pagamento.create({
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
    const  id  = req.params.id as string;
    const dados = req.body
    const escolaId = req.user?.escolaId;

    const pagamentoExistente = await prisma.pagamento.findFirst({
      where: { id: id, aluno: { escolaId } }
    });

    if (!pagamentoExistente) {
      throw new AppError('Pagamento não encontrado ou acesso negado', 404);
    }

    const pagamento = await prisma.pagamento.update({
      where: { id: id },
      data: {
        ...dados,
      },
    })

    return res.json(pagamento)
  },

  // POST /pagamentos/:id/registrar - Registrar pagamento como pago
  async registrarPagamento(req: Request, res: Response) {
    const  id = req.params.id as string;
    const { dataPagamento, valorPago } = req.body

    const pagamento = await prisma.pagamento.findFirst({
      where: {
        id: id,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
    })
    if (!pagamento) throw new AppError('Pagamento não encontrado', 404)
    if (pagamento.status === 'PAGO') throw new AppError('Pagamento já foi registrado', 400)

    const pagamentoAtualizado = await prisma.pagamento.update({
      where: { id },
      data: {
        status: 'PAGO',
        dataPagamento: new Date(dataPagamento),
        valorPago,
      },
    })

    return res.json(pagamentoAtualizado)
  },

  // POST /pagamentos/:id/cancelar - Cancelar um pagamento - soft delete
  async cancelar(req: Request, res: Response) {
    const  id  = req.params.id as string;
    const escolaId = req.user?.escolaId;

    const pagamento = await prisma.pagamento.findFirst({
      where: {
        id,
        aluno: { escolaId, deletedAt: null },
      },
    })

    if (!pagamento) throw new AppError('Pagamento não encontrado', 404)

    if (pagamento.status === 'PAGO') throw new AppError('Não é possível cancelar pagamento já registrado', 400)

    await prisma.pagamento.update({
      where: { id },
      data: { status: 'CANCELADO' },
    })

    return res.json({ message: 'Pagamento cancelado' })
  },

  // GET /pagamentos/inadimplentes - Listar alunos inadimplentes
  async inadimplentes(req: Request, res: Response) {
    const escolaId = req.user?.escolaId;
    const hoje = new Date()


    const agregacaoInadimplentes = await prisma.pagamento.groupBy({
      by: ['alunoId'],
      where: {
        status: 'VENCIDO',
        dataVencimento: { lt: hoje },
        aluno: { escolaId, deletedAt: null }
      },
      _sum: {
        valorTotal: true
      },
      _count: {
        id: true
      }
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
        quantidadeTitulos: item._count.id,
        totalDevido: item._sum.valorTotal
      };
    });

    const totalGeralDevido = resultado.reduce((acc, curr) => acc + Number(curr.totalDevido), 0);

    return res.json({
      totalGeralDevido,
      quantidadeAlunos: resultado.length,
      data: resultado
    });
  },
}