import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withTenancy, withEscolaId } from '../utils/prismaHelpers'

export const alunoController = {
  // GET /alunos - Listar com filtros
  async list(req: Request, res: Response) {
    const { page = 1, limit = 20, turmaId, turno, busca } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    // Construir filtros base
    let where: any = {}
    
    if (turmaId) where.turmaId = turmaId
    if (turno) where.turno = turno
    if (busca) {
      where.nome = {
        contains: busca as string,
        mode: 'insensitive',
      }
    }

    // Adiciona escolaId + deletedAt: null automaticamente
    where = withTenancy(where)

    const [alunos, total] = await Promise.all([
      prisma.aluno.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          turma: {
            select: {
              id: true,
              nome: true,
            },
          },
          responsaveis: {
            select: {
              id: true,
              nome: true,
              tipo: true,
              isResponsavelFinanceiro: true,
            },
          },
          _count: {
            select: {
              responsaveis: true,
              pagamentos: true,
            },
          },
        },
        orderBy: {
          nome: 'asc',
        },
      }),
      prisma.aluno.count({ where }),
    ])

    return res.json({
      data: alunos,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  },

  // GET /alunos/:id - Detalhe
  async show(req: Request, res: Response) {
    const { id } = req.params

    const aluno = await prisma.aluno.findFirst({
      where: withTenancy({ id }),
      include: {
        turma: true,
        responsaveis: {
          include: {
            endereco: true,
          },
        },
        endereco: true,
        contrato: {
          include: {
            responsavelFinanceiro: true,
          },
        },
        pagamentos: {
          where: {
            status: {
              in: ['PENDENTE', 'VENCIDO'],
            },
          },
          take: 5,
          orderBy: {
            dataVencimento: 'asc',
          },
        },
        _count: {
          select: {
            responsaveis: true,
            pagamentos: true,
            notas: true,
          },
        },
      },
    })

    if (!aluno) {
      throw new AppError('Aluno não encontrado', 404)
    }

    return res.json(aluno)
  },

  // POST /alunos - Criar
  async create(req: Request, res: Response) {
    const dados = req.body
    const escolaId = require('../utils/context').getEscolaId()

    if (!escolaId) {
      throw new AppError('Escola não identificada', 400)
    }

    const aluno = await prisma.aluno.create({
      data: {
        ...dados,
        escolaId, // Adiciona manualmente
      },
      include: {
        turma: true,
      },
    })

    return res.status(201).json(aluno)
  },

  // PUT /alunos/:id - Atualizar
  async update(req: Request, res: Response) {
    const { id } = req.params
    const dados = req.body

    // Verifica se aluno existe e pertence à escola
    const alunoExistente = await prisma.aluno.findFirst({
      where: withTenancy({ id }),
    })

    if (!alunoExistente) {
      throw new AppError('Aluno não encontrado', 404)
    }

    const aluno = await prisma.aluno.update({
      where: { id },
      data: dados,
      include: {
        turma: true,
        responsaveis: true,
      },
    })

    return res.json(aluno)
  },

  // DELETE /alunos/:id - Soft Delete
  async delete(req: Request, res: Response) {
    const { id } = req.params

    // Verifica se aluno existe e pertence à escola
    const alunoExistente = await prisma.aluno.findFirst({
      where: withTenancy({ id }),
    })

    if (!alunoExistente) {
      throw new AppError('Aluno não encontrado', 404)
    }

    // Soft delete manual
    await prisma.aluno.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return res.status(204).send()
  },
}