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
        dadosBancarios: true, // Adicionado para carregar dados bancários
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
    const { salarioBase, dadosBancarios, endereco, ...dados } = req.body
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
        dataAdmissao: dados.dataAdmissao ? new Date(dados.dataAdmissao) : undefined,
        salarioBase: Number(salarioBase),

        // SOLUÇÃO: Use o 'connect' em vez de passar a string direto
        escola: {
          connect: { id: escolaId }
        },

        endereco: endereco ? {
          create: endereco
        } : undefined,

        dadosBancarios: dadosBancarios ? {
          create: {
            ...dadosBancarios,
            escolaId // Aqui dentro não tem problema, pois é a criação da tabela filha
          }
        } : undefined
      },
      include: {
        endereco: true,
        dadosBancarios: true
      },
    })

  return res.status(201).json(funcionario)
},

  /**
   * PUT /funcionarios/:id - Atualizar funcionário
   */
  async update(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id
    const escolaId = req.user?.escolaId
    const usuarioLogadoId = req.user?.userId

    if (!escolaId) throw new AppError('Escola não identificada', 400)

    // Verificar se funcionário existe e pertence à escola
    const funcionarioExistente = await prisma.funcionario.findFirst({
      where: withTenancy({ id: idFormatado }),
      include: { dadosBancarios: true }
    })
    if (!funcionarioExistente) {
      throw new AppError('Funcionário não encontrado', 404)
    }

    // Se está alterando CPF, verificar duplicação
    if (req.body.cpf && req.body.cpf !== funcionarioExistente.cpf) { // Manter req.body.cpf para a validação inicial antes da desestruturação completa
      const cpfEmUso = await prisma.funcionario.findFirst({
        where: withEscolaId({
          cpf: req.body.cpf, // Usar req.body.cpf aqui
          id: { not: idFormatado },
        }),
      })

      if (cpfEmUso) {
        throw new AppError('CPF já cadastrado', 400)
      }
    }

    // Desestruturação rigorosa para limpar o payload de dados indesejados
    // e isolar campos com tratamento especial.
    const {
      id: _id, // Descartado: ID vem dos params
      escolaId: _escolaId, // Descartado: escolaId vem do req.user
      createdAt: _createdAt, // Descartado: metadado
      updatedAt: _updatedAt, // Descartado: metadado
      deletedAt: _deletedAt, // Descartado: metadado
      turmas: _turmas, // Descartado: relação (se o frontend enviar)
      enderecoId: _enderecoId, // Descartado: ID da relação (usamos o objeto endereco)
      _count: _count, // Descartado: metadado (se o frontend enviar)
      // Campos com tratamento especial
      endereco,
      dataAdmissao,
      salarioBase,
      dadosBancarios,
      // Agrupa todos os outros campos válidos (nome, cpf, cargo, email, telefone, etc.)
      ...dadosLimpos
    } = req.body

    // Sanitização profunda para o Prisma (remover IDs e metadados de objetos aninhados)
    const cleanEndereco = endereco ? (() => {
      const { id, createdAt, updatedAt, ...rest } = endereco;
      return rest;
    })() : undefined;

    const cleanDadosBancarios = dadosBancarios ? (() => {
      const { id, createdAt, updatedAt, escolaId: _e, ...rest } = dadosBancarios;
      return rest;
    })() : undefined;

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Auditoria de Salário
      if (salarioBase !== undefined && Number(salarioBase) !== Number(funcionarioExistente.salarioBase)) {
        await tx.logAuditoria.create({
          data: {
            entidade: 'FUNCIONARIO',
            entidadeId: idFormatado,
            acao: 'ALTERACAO_SALARIO',
            usuarioId: usuarioLogadoId,
            escolaId: escolaId!, // Garantir que escolaId não é undefined
            ip: req.ip || ''
          }
        })
      }

      // 2. Auditoria de Dados Bancários (Simplificada para aceitar ambos)
      if (dadosBancarios) {
        await tx.logAuditoria.create({
          data: {
            entidade: 'FUNCIONARIO',
            entidadeId: idFormatado,
            acao: 'ALTERACAO_DADOS_BANCARIOS',
            usuarioId: usuarioLogadoId,
            escolaId: escolaId!, // Garantir que escolaId não é undefined
            ip: req.ip || ''
          }
        })
      }

      return tx.funcionario.update({
        where: { id: idFormatado },
        data: {
          ...dadosLimpos, // Campos válidos restantes
          salarioBase: salarioBase !== undefined ? Number(salarioBase) : undefined,
          dataAdmissao: dataAdmissao ? new Date(dataAdmissao) : undefined,
          endereco: endereco ? {
            upsert: {
              create: cleanEndereco,
              update: cleanEndereco
            }
          } : undefined,
          dadosBancarios: dadosBancarios ? {
            upsert: {
              create: { ...cleanDadosBancarios, escolaId },
              update: { ...cleanDadosBancarios }
            }
          } : undefined
        },
        include: { endereco: true, dadosBancarios: true }
      })
    })

    return res.json(resultado)
  },

    /**
     * DELETE /funcionarios/:id - Soft delete
     */
    async delete (req: Request, res: Response) {
  const { id } = req.params
  const idFormatado = Array.isArray(id) ? id[0] : id

  // Verificar se funcionário existe e pertence à escola
  const funcionario = await prisma.funcionario.findFirst({
    where: withTenancy({ id: idFormatado }),
    include: {
      _count: {
        select: { turmas: true }
      }
    }
  })

  if (!funcionario) {
    throw new AppError('Funcionário não encontrado', 404)
  }

  // Regra de Segurança: Impedir demissão de professores com turmas ativas
  if (funcionario._count.turmas > 0) {
    throw new AppError(
      'Não é possível demitir um colaborador com turmas sob sua responsabilidade. Realize a substituição do professor antes da demissão.',
      400
    )
  }

  // Soft delete com alteração de status e data de demissão
  await prisma.funcionario.update({
    where: { id: idFormatado },
    data: {
      statusFuncionario: 'DEMITIDO',
      dataDemissao: new Date(),
      deletedAt: new Date(),
    },
  })

  return res.status(204).send()
},
}
