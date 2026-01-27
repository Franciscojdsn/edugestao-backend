import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withEscolaId } from '../utils/prismaHelpers'

/**
 * CONTROLLER: Responsáveis
 * 
 * Gerencia operações de responsáveis de alunos.
 */
export const responsavelController = {
  
  /**
   * GET /alunos/:alunoId/responsaveis
   * 
   * Lista todos os responsáveis de um aluno específico.
   * 
   * Params:
   * - alunoId: UUID do aluno
   * 
   * Retorna:
   * - aluno: Dados básicos do aluno
   * - responsaveis: Array de responsáveis
   * - total: Quantidade total
   */
  async listarPorAluno(req: Request, res: Response) {
    const { alunoId } = req.params
    const idFormatado = Array.isArray(alunoId) ? alunoId[0] : alunoId

    // Verificar se aluno existe e pertence à escola
    const aluno = await prisma.aluno.findFirst({
      where: withEscolaId({
        id: idFormatado,
        deletedAt: null, // Aluno não deletado
      }),
      select: {
        id: true,
        nome: true,
        numeroMatricula: true,
      },
    })

    if (!aluno) {
      throw new AppError('Aluno não encontrado', 404)
    }

    // Buscar responsáveis
    const responsaveis = await prisma.responsavel.findMany({
      where: { alunoId: idFormatado },
      include: {
        endereco: true,
      },
      orderBy: [
        { isResponsavelFinanceiro: 'desc' }, // Financeiro primeiro
        { nome: 'asc' },
      ],
    })

    return res.json({
      aluno,
      responsaveis,
      total: responsaveis.length,
    })
  },

  /**
   * GET /responsaveis
   * 
   * Lista TODOS os responsáveis da escola (admin).
   * Com filtros e paginação.
   * 
   * Query params:
   * - page, limit
   * - busca: Nome ou CPF
   * - tipo: PAI, MAE, etc
   * - isResponsavelFinanceiro: true/false
   */
  async list(req: Request, res: Response) {
    const {
      page = 1,
      limit = 20,
      busca,
      tipo,
      isResponsavelFinanceiro,
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    // Construir filtros
    let where: any = {}

    if (tipo) where.tipo = tipo
    if (isResponsavelFinanceiro !== undefined) {
      where.isResponsavelFinanceiro = isResponsavelFinanceiro === 'true'
    }

    // Busca por nome ou CPF
    if (busca) {
      where.OR = [
        { nome: { contains: busca as string, mode: 'insensitive' } },
        { cpf: { contains: busca as string, mode: 'insensitive' } },
      ]
    }

    // Multi-tenancy via aluno
    where.aluno = {
      escolaId: req.user?.escolaId,
      deletedAt: null,
    }

    // Buscar responsáveis
    const [responsaveis, total] = await Promise.all([
      prisma.responsavel.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          nome: true,
          tipo: true,
          cpf: true,
          email: true,
          isResponsavelFinanceiro: true,
          aluno: {
            select: {
              id: true,
              nome: true,
              numeroMatricula: true,
            },
          },
        },
        orderBy: {
          nome: 'asc',
        },
      }),
      prisma.responsavel.count({ where }),
    ])

    return res.json({
      data: responsaveis,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  },

  /**
   * GET /responsaveis/:id
   * 
   * Busca um responsável específico por ID.
   * 
   * Retorna dados completos incluindo:
   * - Endereço
   * - Aluno vinculado
   * - Contratos (se for responsável financeiro)
   */
  async show(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const responsavel = await prisma.responsavel.findFirst({
      where: {
        id: idFormatado,
        aluno: {
          escolaId: req.user?.escolaId,
          deletedAt: null,
        },
      },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            numeroMatricula: true,
            turma: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        endereco: true,
        contratos: {
          select: {
            id: true,
            valorMensalidade: true,
            diaVencimento: true,
            dataInicio: true,
            dataFim: true,
          },
        },
      },
    })

    if (!responsavel) {
      throw new AppError('Responsável não encontrado', 404)
    }

    return res.json(responsavel)
  },

  /**
   * POST /responsaveis
   * 
   * Cria um novo responsável vinculado a um aluno.
   * 
   * Body:
   * - alunoId: UUID (obrigatório)
   * - nome, tipo, telefone: obrigatórios
   * - cpf, email: opcionais
   * - isResponsavelFinanceiro: boolean (default: false)
   * 
   * Validações:
   * - Aluno deve existir e pertencer à escola
   * - Se isResponsavelFinanceiro=true, remove flag dos outros
   */
  async create(req: Request, res: Response) {
    const dados = req.body
    const escolaId = req.user?.escolaId

    if (!escolaId) {
      throw new AppError('Escola não identificada', 400)
    }

    // Verificar se aluno existe e pertence à escola
    const aluno = await prisma.aluno.findFirst({
      where: withEscolaId({
        id: dados.alunoId,
        deletedAt: null,
      }),
    })

    if (!aluno) {
      throw new AppError('Aluno não encontrado', 404)
    }

    // Se está marcando como responsável financeiro
    if (dados.isResponsavelFinanceiro) {
      // Remover flag dos outros responsáveis deste aluno
      await prisma.responsavel.updateMany({
        where: { alunoId: dados.alunoId },
        data: { isResponsavelFinanceiro: false },
      })
    }

    // Criar responsável
    const responsavel = await prisma.responsavel.create({
      data: {
        ...dados,
        escolaId, // Multi-tenancy
      },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            numeroMatricula: true,
          },
        },
      },
    })

    return res.status(201).json(responsavel)
  },

  /**
   * PUT /responsaveis/:id
   * 
   * Atualiza um responsável existente.
   * 
   * Não permite alterar o alunoId (vínculo é fixo).
   * 
   * Se alterar isResponsavelFinanceiro para true,
   * remove a flag dos outros responsáveis do mesmo aluno.
   */
  async update(req: Request, res: Response) {
    const { id } = req.params
    const dados = req.body
    const idFormatado = Array.isArray(id) ? id[0] : id

    // Verificar se responsável existe e pertence à escola
    const responsavelExistente = await prisma.responsavel.findFirst({
      where: {
        id: idFormatado,
        aluno: {
          escolaId: req.user?.escolaId,
          deletedAt: null,
        },
      },
    })

    if (!responsavelExistente) {
      throw new AppError('Responsável não encontrado', 404)
    }

    // Se está alterando para responsável financeiro
    if (dados.isResponsavelFinanceiro && !responsavelExistente.isResponsavelFinanceiro) {
      // Remover flag dos outros
      await prisma.responsavel.updateMany({
        where: {
          alunoId: responsavelExistente.alunoId,
          id: { not: idFormatado },
        },
        data: { isResponsavelFinanceiro: false },
      })
    }

    // Atualizar
    const responsavel = await prisma.responsavel.update({
      where: { id: idFormatado },
      data: dados,
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    })

    return res.json(responsavel)
  },

  /**
   * DELETE /responsaveis/:id
   * 
   * Deleta um responsável.
   * 
   * IMPORTANTE: Responsável NÃO tem soft delete.
   * É hard delete (DELETE físico).
   * 
   * Proteção:
   * - Não permite deletar se for único responsável do aluno
   * - Não permite deletar se tiver contratos ativos
   */
  async delete(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    // Verificar se responsável existe
    const responsavel = await prisma.responsavel.findFirst({
      where: {
        id: idFormatado,
        aluno: {
          escolaId: req.user?.escolaId,
          deletedAt: null,
        },
      },
      include: {
        _count: {
          select: {
            contratos: true,
          },
        },
      },
    })

    if (!responsavel) {
      throw new AppError('Responsável não encontrado', 404)
    }

    // Não permitir deletar se tiver contratos
    if (responsavel._count.contratos > 0) {
      throw new AppError(
        'Não é possível deletar responsável com contratos vinculados',
        400
      )
    }

    // Verificar se é o único responsável do aluno
    const totalResponsaveis = await prisma.responsavel.count({
      where: { alunoId: responsavel.alunoId },
    })

    if (totalResponsaveis === 1) {
      throw new AppError(
        'Não é possível deletar o único responsável do aluno',
        400
      )
    }

    // Deletar
    await prisma.responsavel.delete({
      where: { id: idFormatado },
    })

    return res.status(204).send()
  },
}