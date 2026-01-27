import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withTenancy, withEscolaId } from '../utils/prismaHelpers'

// ============================================
// CONTROLLER - ALUNOS
// ============================================

export const alunoController = {
  /**
   * GET /alunos - Listar com filtros e paginação
   */
  async list(req: Request, res: Response) {
    const { 
      page = 1, 
      limit = 20, 
      turmaId, 
      turno, 
      busca 
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    // Construir filtros
    let where: any = {}
    
    if (turmaId) where.turmaId = turmaId
    if (turno) where.turno = turno
    
    // Busca por nome ou matrícula
    if (busca) {
      where.OR = [
        {
          nome: {
            contains: busca as string,
            mode: 'insensitive',
          },
        },
        {
          numeroMatricula: {
            contains: busca as string,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Aplicar multi-tenancy e soft delete
    where = withTenancy(where)

    // Buscar alunos + contagem total
    const [alunos, total] = await Promise.all([
      prisma.aluno.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          nome: true,
          cpf: true,
          dataNascimento: true,
          numeroMatricula: true,
          turno: true,
          createdAt: true,
          turma: {
            select: {
              id: true,
              nome: true,
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

  /**
   * GET /alunos/:id - Buscar por ID
   */
  async show(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const aluno = await prisma.aluno.findFirst({
      where: withTenancy({ id: idFormatado }),
      include: {
        turma: true,
        endereco: true,
        responsaveis: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            email: true,
            isResponsavelFinanceiro: true,
          },
        },
        contrato: {
          select: {
            id: true,
            valorMensalidade: true,
            diaVencimento: true,
            dataInicio: true,
            dataFim: true,
          },
        },
        _count: {
          select: {
            responsaveis: true,
            pagamentos: true,
            notas: true,
            atividadesExtra: true,
          },
        },
      },
    })

    if (!aluno) {
      throw new AppError('Aluno não encontrado', 404)
    }

    return res.json(aluno)
  },

  /**
   * POST /alunos - Criar novo aluno
   */
  async create(req: Request, res: Response) {
    const dados = req.body
    const escolaId = req.user?.escolaId

    if (!escolaId) {
      throw new AppError('Escola não identificada', 400)
    }

    // Verificar se número de matrícula já existe
    const matriculaExiste = await prisma.aluno.findFirst({
      where: withEscolaId({
        numeroMatricula: dados.numeroMatricula,
      }),
    })

    if (matriculaExiste) {
      throw new AppError('Número de matrícula já está em uso', 400)
    }

    // Se forneceu turmaId, verificar se existe e pertence à escola
    if (dados.turmaId) {
      const turma = await prisma.turma.findFirst({
        where: withEscolaId({ id: dados.turmaId }),
      })

      if (!turma) {
        throw new AppError('Turma não encontrada', 404)
      }
    }

    // Converter dataNascimento para DateTime se fornecido
    if (dados.dataNascimento) {
      // Se vier como YYYY-MM-DD, converte para ISO
      if (/^\d{4}-\d{2}-\d{2}$/.test(dados.dataNascimento)) {
        dados.dataNascimento = new Date(dados.dataNascimento).toISOString()
      }
    }

    // Criar aluno
    const aluno = await prisma.aluno.create({
      data: {
        ...dados,
        escolaId,
        dataNascimento: dados.dataNascimento 
          ? new Date(dados.dataNascimento) 
          : undefined,
      },
      include: {
        turma: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    })

    return res.status(201).json(aluno)
  },

  /**
   * PUT /alunos/:id - Atualizar aluno
   */
  async update(req: Request, res: Response) {
    const { id } = req.params
    const dados = req.body
    const idFormatado = Array.isArray(id) ? id[0] : id

    // Verificar se aluno existe e pertence à escola
    const alunoExistente = await prisma.aluno.findFirst({
      where: withTenancy({ id: idFormatado }),
    })

    if (!alunoExistente) {
      throw new AppError('Aluno não encontrado', 404)
    }

    // Se está alterando número de matrícula, verificar duplicação
    if (dados.numeroMatricula && dados.numeroMatricula !== alunoExistente.numeroMatricula) {
      const matriculaEmUso = await prisma.aluno.findFirst({
        where: withEscolaId({
          numeroMatricula: dados.numeroMatricula,
          id: { not: idFormatado },
        }),
      })

      if (matriculaEmUso) {
        throw new AppError('Número de matrícula já está em uso', 400)
      }
    }

    // Se está vinculando a uma turma, verificar se existe
    if (dados.turmaId) {
      const turma = await prisma.turma.findFirst({
        where: withEscolaId({ id: dados.turmaId }),
      })

      if (!turma) {
        throw new AppError('Turma não encontrada', 404)
      }
    }

    // Converter dataNascimento se fornecido
    if (dados.dataNascimento) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dados.dataNascimento)) {
        dados.dataNascimento = new Date(dados.dataNascimento).toISOString()
      }
    }

    // Atualizar
    const aluno = await prisma.aluno.update({
      where: { id: idFormatado },
      data: {
        ...dados,
        dataNascimento: dados.dataNascimento 
          ? new Date(dados.dataNascimento) 
          : undefined,
      },
      include: {
        turma: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    })

    return res.json(aluno)
  },

  /**
   * DELETE /alunos/:id - Soft delete
   */
  async delete(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    // Verificar se aluno existe e pertence à escola
    const aluno = await prisma.aluno.findFirst({
      where: withTenancy({ id: idFormatado }),
    })

    if (!aluno) {
      throw new AppError('Aluno não encontrado', 404)
    }

    // Soft delete
    await prisma.aluno.update({
      where: { id: idFormatado },
      data: { 
        deletedAt: new Date(),
      },
    })

    return res.status(204).send()
  },
}
