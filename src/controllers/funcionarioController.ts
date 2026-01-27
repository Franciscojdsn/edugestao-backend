import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withTenancy, withEscolaId } from '../utils/prismaHelpers'

// ============================================
// CONTROLLER - FUNCIONÁRIOS
// ============================================

export const funcionarioController = {
  /**
   * GET /funcionarios - Listar com filtros e paginação
   */
  async list(req: Request, res: Response) {
    const { 
      page = 1, 
      limit = 20, 
      cargo, 
      busca 
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    // Construir filtros
    let where: any = {}
    
    if (cargo) where.cargo = cargo
    
    // Busca por nome ou CPF
    if (busca) {
      where.OR = [
        {
          nome: {
            contains: busca as string,
            mode: 'insensitive',
          },
        },
        {
          cpf: {
            contains: busca as string,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Aplicar multi-tenancy e soft delete
    where = withTenancy(where)

    // Buscar funcionários + contagem total
    const [funcionarios, total] = await Promise.all([
      prisma.funcionario.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          nome: true,
          cpf: true,
          cargo: true,
          telefone: true,
          email: true,
          dataAdmissao: true,
          createdAt: true,
          _count: {
            select: {
              turmas: true,
            },
          },
        },
        orderBy: {
          nome: 'asc',
        },
      }),
      prisma.funcionario.count({ where }),
    ])

    return res.json({
      data: funcionarios,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    })
  },

  /**
   * GET /funcionarios/:id - Buscar por ID
   */
  async show(req: Request, res: Response) {
    const { id } = req.params

    const idFormatado = Array.isArray(id) ? id[0] : id

    const funcionario = await prisma.funcionario.findFirst({
      where: withTenancy({ id: idFormatado }),
      include: {
        endereco: true,
        turmas: {
          select: {
            turma: {
              select: {
                id: true,
                nome: true,
                turno: true,
              },
            },
          },
        },
        _count: {
          select: {
            turmas: true,
          },
        },
      },
    })

    if (!funcionario) {
      throw new AppError('Funcionário não encontrado', 404)
    }

    return res.json(funcionario)
  },

  /**
   * POST /funcionarios - Criar novo funcionário
   */
  async create(req: Request, res: Response) {
    const dados = req.body
    const escolaId = req.user?.escolaId

    if (!escolaId) {
      throw new AppError('Escola não identificada', 400)
    }

    // Verificar se CPF já existe
    const cpfExiste = await prisma.funcionario.findFirst({
      where: withEscolaId({
        cpf: dados.cpf,
      }),
    })

    if (cpfExiste) {
      throw new AppError('CPF já cadastrado', 400)
    }

    // Converter dataAdmissao para DateTime se fornecido
    if (dados.dataAdmissao) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dados.dataAdmissao)) {
        dados.dataAdmissao = new Date(dados.dataAdmissao).toISOString()
      }
    }

    // Criar funcionário
    const funcionario = await prisma.funcionario.create({
      data: {
        ...dados,
        escolaId,
        dataAdmissao: dados.dataAdmissao 
          ? new Date(dados.dataAdmissao) 
          : undefined,
      },
    })

    return res.status(201).json(funcionario)
  },

  /**
   * PUT /funcionarios/:id - Atualizar funcionário
   */
  async update(req: Request, res: Response) {
    const { id } = req.params
    const dados = req.body
    const idFormatado = Array.isArray(id) ? id[0] : id

    // Verificar se funcionário existe e pertence à escola
    const funcionarioExistente = await prisma.funcionario.findFirst({
      where: withTenancy({ id: idFormatado }),
    })

    if (!funcionarioExistente) {
      throw new AppError('Funcionário não encontrado', 404)
    }

    // Se está alterando CPF, verificar duplicação
    if (dados.cpf && dados.cpf !== funcionarioExistente.cpf) {
      const cpfEmUso = await prisma.funcionario.findFirst({
        where: withEscolaId({
          cpf: dados.cpf,
          id: { not: idFormatado },
        }),
      })

      if (cpfEmUso) {
        throw new AppError('CPF já cadastrado', 400)
      }
    }

    // Converter dataAdmissao se fornecido
    if (dados.dataAdmissao) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dados.dataAdmissao)) {
        dados.dataAdmissao = new Date(dados.dataAdmissao).toISOString()
      }
    }

    // Atualizar
    const funcionario = await prisma.funcionario.update({
      where: { id: idFormatado },
      data: {
        ...dados,
        dataAdmissao: dados.dataAdmissao 
          ? new Date(dados.dataAdmissao) 
          : undefined,
      },
    })

    return res.json(funcionario)
  },

  /**
   * DELETE /funcionarios/:id - Soft delete
   */
  async delete(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    // Verificar se funcionário existe e pertence à escola
    const funcionario = await prisma.funcionario.findFirst({
      where: withTenancy({ id: idFormatado }),
    })

    if (!funcionario) {
      throw new AppError('Funcionário não encontrado', 404)
    }

    // Soft delete
    await prisma.funcionario.update({
      where: { id: idFormatado },
      data: { 
        deletedAt: new Date(),
      },
    })

    return res.status(204).send()
  },
}
