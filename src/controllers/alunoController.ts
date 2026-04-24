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
      limit = 10,
      turmaId,
      turno,
      busca,
      status // Recebe o status da query string
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    // Construir filtros
    let where: any = {}

    if (turmaId) where.turmaId = turmaId
    if (turno) where.turno = turno

    // Filtro baseado no relacionamento com Contrato
    if (status === 'ATIVO') {
      where.contrato = { ativo: true }
    }

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
    const [alunos, totalAlunos, totalInadimplentes] = await Promise.all([
      prisma.aluno.findMany({
        where: withEscolaId(where),
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
              turno: true, // Adiciona o turno da turma
            },
          },
          boletos: {
            where: { status: 'VENCIDO' },
            select: { id: true }
          },
          _count: {
            select: {
              responsaveis: true,
            },
          },
        },
        orderBy: {
          nome: 'asc',
        },
      }),
      // B. Contagem Total para Paginação
      prisma.aluno.count({ where: withEscolaId(where) }),

      // C. Contagem de Inadimplentes (Crucial para o Widget do Dashboard)
      prisma.aluno.count({
        where: withEscolaId({
          ...where,
          boletos: { some: { status: 'VENCIDO' } }
        })
      })
    ]);

    const dataMapeada = alunos.map((aluno) => {
      // Regra de Negócio: Se tem 1 ou mais boletos vencidos = INADIMPLENTE
      const isInadimplente = aluno.boletos && aluno.boletos.length > 0;

      // Removemos o array de boletos da resposta final por segurança e leveza
      const { boletos, ...alunoLimpo } = aluno;

      return {
        ...alunoLimpo,
        financeiroStatus: isInadimplente ? 'INADIMPLENTE' : 'EM_DIA'
      };
    });

    // 4. Retorno Estruturado
    return res.json({
      data: dataMapeada,
      meta: {
        total: totalAlunos,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalAlunos / Number(limit))
      },
      stats: { // <- O Dashboard consumirá este nó para os Widgets
        totalAlunos: totalAlunos,
        inadimplentes: totalInadimplentes
      }
    });
  },

  /**
   * GET /alunos/:id - Buscar por ID
   */
  async show(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: idFormatado,
        escolaId: req.user?.escolaId,
        deletedAt: null
      },
      include: {
        turma: true,
        endereco: true,
        responsaveis: {
          select: { id: true, nome: true, tipo: true, email: true, isResponsavelFinanceiro: true }
        },
        contrato: {
          select: {
            id: true,
            valorMensalidadeBase: true,
            descontoMensalidade: true,
            valorMatricula: true,
            descontoMatricula: true,
            quantidadeParcelas: true,
            diaVencimento: true,
            dataInicio: true,
            dataFim: true,
            status: true,
            ativo: true
          }
        },
        boletos: {
          orderBy: { dataVencimento: 'asc' } // Traz ordenado do mais antigo pro mais novo
        },
        _count: {
          select: { responsaveis: true, atividadesExtra: true }
        },
        atividadesExtra: {
          include: { atividadeExtra: true },
          where: { ativo: true } // Traz apenas as atividades que não foram canceladas
        }
      }
    })

    if (!aluno) {
      throw new AppError('Aluno não encontrado', 404)
    }

    const statusDerivado = aluno.contrato?.ativo ? 'ATIVO' : 'INATIVO';

    // Retorna o objeto do aluno injetando o status derivado
    return res.json({
      ...aluno,
      status: (aluno as any).status || statusDerivado

    })
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
    const { dataNascimento, turmaId, ...restDados } = dados;

    if (turmaId) {
      const turma = await prisma.turma.findFirst({
        where: withEscolaId({ id: turmaId }),
      })

      if (!turma) {
        throw new AppError('Turma não encontrada', 404)
      }
    }

    // Criar aluno
    const aluno = await prisma.aluno.create({
      data: {
        ...restDados,
        escolaId,
        ...(turmaId && { turma: { connect: { id: turmaId } } }),
        dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined,
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

    // 1. Blindagem Arquitural: Whitelist estrita de campos cadastrais, de saúde e endereço.
    // Campos financeiros, de contrato ou metadados de sistema são estritamente ignorados.
    const {
      nome,
      dataNascimento,
      genero,
      cpf,
      numeroSus,
      planoSaude,
      hospital,
      matriculaPlano,
      turmaId,
      turno,
      // Dados de endereço (mapeados para a tabela relacionada)
      cep,
      logradouro, // Mapeia para 'rua' no schema
      numero,
      complemento,
      bairro,
      cidade,
      estado,
    } = req.body

    const idFormatado = Array.isArray(id) ? id[0] : id

    // 2. Verificar se aluno existe e pertence à escola (Multi-tenancy)
    const alunoExistente = await prisma.aluno.findFirst({
      where: withTenancy({ id: idFormatado }),
    })
    if (!alunoExistente) {
      throw new AppError('Aluno não encontrado', 404)
    }

    // 3. Validação de Turma (se fornecida no payload)
    if (turmaId) {
      const turma = await prisma.turma.findFirst({
        where: withEscolaId({ id: turmaId }),
      })
      if (!turma) {
        throw new AppError('Turma não encontrada', 404)
      }
    }

    // 4. Preparação do Update de Endereço (Nested Upsert)
    const hasEnderecoData = !!(cep || logradouro || numero || bairro || cidade || estado);
    const enderecoUpdate = hasEnderecoData ? {
      upsert: {
        create: {
          cep: cep || '',
          rua: logradouro || '',
          numero: numero ? String(numero) : '',
          complemento,
          bairro: bairro || '',
          cidade: cidade || '',
          estado: estado || '',
        },
        update: {
          cep,
          rua: logradouro,
          numero: numero ? String(numero) : undefined,
          complemento,
          bairro,
          cidade,
          estado,
        }
      }
    } : undefined;

    // 5. Persistência Controlada: Somente campos seguros e higienizados são repassados ao Prisma
    const aluno = await prisma.aluno.update({
      where: { id: idFormatado },
      data: {
        nome,
        genero,
        cpf,
        // Correção do erro Prisma: Usar relação nested em vez de scalar field
        ...(turmaId !== undefined && {
          turma: turmaId ? { connect: { id: turmaId } } : { disconnect: true }
        }),
        ...(turno !== undefined && { turno }),
        // Dados de saúde (Nota: Garanta que estes campos existam no seu schema Aluno)
        ...(numeroSus !== undefined && { numeroSus }),
        ...(planoSaude !== undefined && { planoSaude: Boolean(planoSaude) }),
        ...(hospital !== undefined && { hospital }),
        ...(matriculaPlano !== undefined && { matriculaPlano }),
        
        dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined,
        
        // Atualização aninhada do endereço
        endereco: enderecoUpdate,
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
