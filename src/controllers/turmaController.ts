import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withEscolaId } from '../utils/prismaHelpers'

// ============================================
// CONTROLLER - TURMAS
// ============================================

export const turmaController = {
  /**
   * GET /turmas - Listar com filtros e paginação
   */
  async list(req: Request, res: Response) {
    const { 
      page = 1, 
      limit = 20, 
      anoLetivo, 
      turno, 
      busca 
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    // Construir filtros
    let where: any = {}
    
    if (anoLetivo) where.anoLetivo = Number(anoLetivo)
    if (turno) where.turno = turno
    
    // Busca por nome
    if (busca) {
      where.nome = {
        contains: busca as string,
        mode: 'insensitive',
      }
    }

    // Aplicar multi-tenancy
    where = withEscolaId(where)

    // Buscar turmas + contagem total
    const [turmas, total] = await Promise.all([
      prisma.turma.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          nome: true,
          anoLetivo: true,
          turno: true,
          capacidadeMaxima: true,
          createdAt: true,
          _count: {
            select: {
              alunos: true,
              professores: true,
              disciplinas: true,
            },
          },
        },
        orderBy: [
          { anoLetivo: 'desc' },
          { nome: 'asc' },
        ],
      }),
      prisma.turma.count({ where }),
    ])

    return res.json({
      data: turmas,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  },

  /**
   * GET /turmas/:id - Buscar por ID
   */
  async show(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const turma = await prisma.turma.findFirst({
      where: withEscolaId({ id: idFormatado }),
      include: {
        alunos: {
          select: {
            id: true,
            nome: true,
            numeroMatricula: true,
            turno: true,
          },
          where: {
            deletedAt: null, // Não mostrar alunos deletados
          },
          orderBy: {
            nome: 'asc',
          },
        },
        disciplinas: {
          select: {
            disciplina: {
              select: {
                id: true,
                nome: true,
                cargaHoraria: true,
              },
            },
          },
        },
        professores: {
          select: {
            professor: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        _count: {
          select: {
            alunos: true,
            professores: true,
            disciplinas: true,
          },
        },
      },
    })

    if (!turma) {
      throw new AppError('Turma não encontrada', 404)
    }

    return res.json(turma)
  },

  /**
   * POST /turmas - Criar nova turma
   */
  async create(req: Request, res: Response) {
    const dados = req.body
    const escolaId = req.user?.escolaId

    if (!escolaId) {
      throw new AppError('Escola não identificada', 400)
    }

    // Verificar se já existe turma com mesmo nome no ano
    const turmaExiste = await prisma.turma.findFirst({
      where: withEscolaId({
        nome: dados.nome,
        anoLetivo: dados.anoLetivo,
      }),
    })

    if (turmaExiste) {
      throw new AppError('Já existe uma turma com este nome neste ano', 400)
    }

    // Criar turma
    const turma = await prisma.turma.create({
      data: {
        ...dados,
        escolaId,
      },
      include: {
        _count: {
          select: {
            alunos: true,
          },
        },
      },
    })

    return res.status(201).json(turma)
  },

  /**
   * PUT /turmas/:id - Atualizar turma
   */
  async update(req: Request, res: Response) {
    const { id } = req.params
    const dados = req.body
    const idFormatado = Array.isArray(id) ? id[0] : id
    // Verificar se turma existe e pertence à escola
    const turmaExistente = await prisma.turma.findFirst({
      where: withEscolaId({ id: idFormatado }),
    })

    if (!turmaExistente) {
      throw new AppError('Turma não encontrada', 404)
    }

    // Se está alterando nome ou ano, verificar duplicação
    if (dados.nome || dados.anoLetivo) {
      const nomeVerificar = dados.nome || turmaExistente.nome
      const anoVerificar = dados.anoLetivo || turmaExistente.anoLetivo

      const duplicada = await prisma.turma.findFirst({
        where: withEscolaId({
          nome: nomeVerificar,
          anoLetivo: anoVerificar,
          id: { not: idFormatado },
        }),
      })

      if (duplicada) {
        throw new AppError('Já existe uma turma com este nome neste ano', 400)
      }
    }

    // Atualizar
    const turma = await prisma.turma.update({
      where: { id: idFormatado },
      data: dados,
      include: {
        _count: {
          select: {
            alunos: true,
            professores: true,
            disciplinas: true,
          },
        },
      },
    })

    return res.json(turma)
  },

  /**
   * DELETE /turmas/:id - Deletar turma
   * 
   * ATENÇÃO: Turma NÃO tem soft delete!
   * Só pode deletar se não tiver alunos vinculados.
   */
  async delete(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id
    // Verificar se turma existe e pertence à escola
    const turma = await prisma.turma.findFirst({
      where: withEscolaId({ id: idFormatado }),
      include: {
        _count: {
          select: {
            alunos: true,
          },
        },
      },
    })

    if (!turma) {
      throw new AppError('Turma não encontrada', 404)
    }

    // Não permitir deletar se tiver alunos
    if (turma._count.alunos > 0) {
      throw new AppError(
        `Não é possível deletar turma com ${turma._count.alunos} aluno(s) vinculado(s)`,
        400
      )
    }

    // Deletar
    await prisma.turma.delete({
      where: { id: idFormatado },
    })

    return res.status(204).send()
  },
}
