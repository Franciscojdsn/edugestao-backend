import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { stat } from 'fs';

// ============================================
// CONTROLLER - TURMAS
// ============================================

export const turmaController = {
  /**
   * GET /turmas - Listar com filtros e paginação
   */
  async list(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const { anoLetivo, turno, busca } = req.query as any;

    const skip = (page - 1) * limit;
    const escolaId = req.user?.escolaId

    // Construir filtros
    let where: any = { escolaId }

    if (anoLetivo) where.anoLetivo = Number(anoLetivo)
    if (turno) where.turno = turno

    // Busca por nome
    if (busca) {
      where.nome = { contains: busca as string, mode: 'insensitive', }
    }

    // Buscar turmas + contagem total
    const [turmas, total] = await Promise.all([
      prisma.turma.findMany({
        where,
        skip: skip,
        take: limit,
        include: {
          professores: {
            where: { isPrincipal: true }, // Opcional: traz apenas o professor titular
            select: {
              isPrincipal: true,
              professor: {
                select: {
                  id: true,
                  nome: true,
                  // Você pode filtrar aqui apenas se o cargo for PROFESSOR na lógica do seu código
                }
              }
            }
          },
          _count: {
            select: {
              alunos: {
                where: {
                  deletedAt: null, contrato: {
                    ativo: true // APENAS alunos com contrato ativo
                  }
                }
              }
            }
          }
        },
        orderBy: { nome: 'asc' },
      }),
      prisma.turma.count({ where }),
    ]);

    return res.json({
      data: turmas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  },

  /**
   * GET /turmas/:id - Buscar por ID
   */
  async show(req: Request, res: Response) {
    const id = req.params.id as string;
    const escolaId = req.user?.escolaId

    const turma = await prisma.turma.findFirst({
      where: { id, escolaId },
      include: {
        professores: {
          include: { // Inclui o objeto completo do professor para ter acesso ao ID
            professor: true
          }
        },
        disciplinas: {
          include: { disciplina: { select: { id: true, nome: true, cargaHoraria: true } } },
        },
        alunos: {
          where: {
            deletedAt: null, contrato: {
              ativo: true,
              escolaId: escolaId // 
            }
          },
          select: {
            id: true,
            nome: true,
            numeroMatricula: true,
            boletos: {
              where: { status: 'VENCIDO', escolaId: escolaId },
              select: { id: true }
            }
          },
          orderBy: { nome: 'asc' } // Já traz ordenado do banco para ajudar o Frontend
        },
        _count: {
          select: { alunos: { where: { deletedAt: null } } }
        }
      }
    });

    if (!turma) {
      throw new AppError('Turma não encontrada', 404)
    }

    const response = {
      ...turma,
      professorPrincipal: turma.professores.find(p => p.isPrincipal)?.professor.nome || 'Sem Professor', // Mantém para exibição
      professorResponsavelId: turma.professores.find(p => p.isPrincipal)?.professor.id || null, // Adiciona o ID para o formulário
      totalAlunosAtivos: turma.alunos.length,
      alunos: turma.alunos.map(aluno => ({
        ...aluno,
        // Estado derivado para o Dashboard/DadosTurmas
        financeiroStatus: aluno.boletos.length > 0 ? 'INADIMPLENTE' : 'REGULAR'
      }))
    };

    return res.json(response);
  },

  /**
   * POST /turmas - Criar nova turma
   */
  async create(req: Request, res: Response) {
    const { professorResponsavelId, ...dadosTurma } = req.body;
    const escolaId = req.user?.escolaId;

    if (!escolaId) {
      throw new AppError('Escola não identificada', 400)
    }

    // Verificar se já existe turma com mesmo nome no ano
    const turmaExistente = await prisma.turma.findFirst({
      where: {
        nome: dadosTurma.nome,
        anoLetivo: dadosTurma.anoLetivo,
        escolaId
      }
    });

    if (turmaExistente) {
      throw new AppError('Já existe uma turma com este nome para o ano letivo informado', 400);
    }

    const resultado = await prisma.$transaction(async (tx) => {

      // A. Criar a Turma vinculada ao Tenant
      const novaTurma = await tx.turma.create({
        data: {
          ...dadosTurma,
          escolaId, // Garantindo Isolamento
        },
      });

      // B. Se houver professor selecionado, criar o vínculo na tabela N:N
      if (professorResponsavelId) {
        await tx.turmaProfessor.create({
          data: {
            turmaId: novaTurma.id,
            professorId: professorResponsavelId,
            isPrincipal: true, // Por padrão, o primeiro vinculado é o principal
          },
        });
      }

      return novaTurma;
    });

    return res.status(201).json(resultado);
  },

  /**
   * PUT /turmas/:id - Atualizar turma
   */
  async update(req: Request, res: Response) {
    const id = req.params.id as string;
    // Desestruturação defensiva para remover campos indesejados que o front possa enviar
    const { 
      professorResponsavelId, 
      ano: _ano, // Descartado: campo legado que causa o erro PrismaClientValidationError
      id: _id, // Descartado: o ID vem dos parâmetros da URL
      escolaId: _escolaId, // Descartado: escolaId vem do req.user
      createdAt: _createdAt, 
      updatedAt: _updatedAt,
      _count: _count,
      ...dados 
    } = req.body;
    const escolaId = req.user?.escolaId;
    const usuarioId = req.user?.userId;

    // Verificar se turma existe e pertence à escola
    const turmaExistente = await prisma.turma.findFirst({
      where: { id, escolaId },
    });

    if (!turmaExistente) {
      throw new AppError('Turma não encontrada ou acesso negado', 404);
    }

    // Se está alterando nome ou ano, verificar duplicação
    if (dados.nome || dados.anoLetivo) {
      const nomeParaVerificar = dados.nome ?? turmaExistente.nome;
      const anoParaVerificar = dados.anoLetivo ?? turmaExistente.anoLetivo;

      const conflito = await prisma.turma.findFirst({
        where: {
          escolaId,
          nome: nomeParaVerificar,
          anoLetivo: anoParaVerificar,
          id: { not: id }, // Garante que não é a própria turma
        },
      });

      if (conflito) {
        throw new AppError('Já existe outra turma com este nome para este ano letivo', 400);
      }
    }

    // Executar atualização com Auditoria em Transação
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Atualizar o Professor Responsável (Vínculo N:N)
      // Se o campo foi enviado no payload (mesmo que seja null para desvincular)
      if (professorResponsavelId !== undefined) {
        // A. Removemos o status de 'principal' de qualquer professor atual desta turma
        await tx.turmaProfessor.updateMany({
          where: { turmaId: id, isPrincipal: true },
          data: { isPrincipal: false }
        });

        // B. Se um ID de professor foi fornecido, definimos como o novo principal
        if (professorResponsavelId) {
          await tx.turmaProfessor.upsert({
            where: {
              turmaId_professorId: {
                turmaId: id,
                professorId: professorResponsavelId
              }
            },
            update: { isPrincipal: true },
            create: {
              turmaId: id,
              professorId: professorResponsavelId,
              isPrincipal: true
            }
          });
        }
      }

      // 2. Atualizar os dados da Turma
      const turma = await tx.turma.update({
        where: { id },
        data: {
          ...dados,
          anoLetivo: dados.anoLetivo ? Number(dados.anoLetivo) : undefined,
          capacidadeMaxima: dados.capacidadeMaxima ? Number(dados.capacidadeMaxima) : undefined,
        },
        include: {
          _count: {
            select: { alunos: true, disciplinas: true }
          }
        },
      });

      // Auditoria: Verificar se campos sensíveis foram alterados
      const alterouNome = dados.nome && dados.nome !== turmaExistente.nome;
      const alterouCapacidade = dados.capacidadeMaxima !== undefined && Number(dados.capacidadeMaxima) !== turmaExistente.capacidadeMaxima;

      if (alterouNome || alterouCapacidade) {
        await tx.logAuditoria.create({
          data: {
            entidade: 'TURMA',
            entidadeId: id,
            acao: 'ATUALIZACAO_DADOS_MESTRES',
            usuarioId: usuarioId!,
            escolaId: escolaId!,
            ip: req.ip || ''
          }
        });
      }

      return turma;
    });

    return res.json(resultado);
  },

  /**
   * DELETE /turmas/:id - Deletar turma
   * 
   * ATENÇÃO: Turma NÃO tem soft delete!
   * Só pode deletar se não tiver alunos vinculados.
   */
  async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    const escolaId = req.user?.escolaId;

    // Verificar se turma existe e pertence à escola
    const turma = await prisma.turma.findFirst({
      where: { id, escolaId },
      include: {
        _count: {
          select: {
            alunos: { where: { deletedAt: null } }
          },
        },
      },
    });

    if (!turma) {
      throw new AppError('Turma não encontrada', 404)
    }

    // Não permitir deletar se tiver alunos
    if (turma._count.alunos > 0) {
      throw new AppError(
        `Ação negada: Existem ${turma._count.alunos} aluno(s) nesta turma. Transfira-os antes de deletar.`,
        400
      );
    }

    // Deletar
    await prisma.turma.delete({
      where: { id },
    })

    return res.status(204).send()
  },
}
