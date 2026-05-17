import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

export const turmaController = {
  /**
   * GET /turmas
   */
  async list(req: Request, res: Response) {
    const { page = 1, limit = 20, anoLetivo, turno, busca } = req.query as any;
    const skip = (page - 1) * limit;

    let where: any = {};
    if (anoLetivo) where.anoLetivo = anoLetivo;
    if (turno) where.turno = turno;
    if (busca) where.nome = { contains: busca, mode: 'insensitive' };

    // Extensão aplica escolaId e deletedAt: null automaticamente
    const [turmas, total] = await Promise.all([
      prisma.turma.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { alunos: { where: { deletedAt: null } } }
          }
        },
        orderBy: [{ anoLetivo: 'desc' }, { nome: 'asc' }]
      }),
      prisma.turma.count({ where })
    ]);

    return res.json({
      status: 'success',
      data: turmas.map(t => ({
        ...t,
        vagasDisponiveis: t.capacidadeMaxima - t._count.alunos
      })),
      meta: { total, page, limit }
    });
  },

  /**
   * GET /turmas/:id
   */
  async show(req: Request, res: Response) {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    const turma = await prisma.turma.findFirst({
      where: { id: String(id) },
      include: {
        turmaProfessors: { include: { professor: true } },
        alunos: { where: { deletedAt: null } },
        _count: { select: { alunos: { where: { deletedAt: null } } } }
      }
    });

    if (!turma) throw new AppError('Turma não encontrada', 404);

    return res.json({ status: 'success', data: turma });
  },

  /**
   * POST /turmas
   */
  async create(req: Request, res: Response) {
    const dados = req.body;

    // 1. Trava Anti-Colisão (Garantindo que a escola não crie turmas duplicadas)
    const conflito = await prisma.turma.findFirst({
      where: {
        nome: dados.nome,
        anoLetivo: dados.anoLetivo,
        turno: dados.turno
      }
    });

    if (conflito) throw new AppError('Já existe uma turma cadastrada com este nome, turno e ano letivo.', 400);

    // 2. Transação para criar a Turma e já vincular o Professor Responsável (se houver)
    const resultado = await prisma.$transaction(async (tx) => {
      const novaTurma = await tx.turma.create({
        data: {
          escolaId: req.user?.escolaId as string,
          nome: dados.nome,
          anoLetivo: dados.anoLetivo,
          turno: dados.turno,
          capacidadeMaxima: dados.capacidadeMaxima,
          // escolaId é injetado pela extensão Prisma
        }
      });

      if (dados.professorResponsavelId) {
        await tx.turmaProfessor.create({
          data: {
            turmaId: novaTurma.id,
            professorId: dados.professorResponsavelId,
            isPrincipal: true,
            escolaId: req.user?.escolaId as string,
            // escolaId será injetado pela extensão
          }
        });
      }

      return novaTurma;
    });

    return res.status(201).json({ status: 'success', data: resultado });
  },

  /**
   * PUT /turmas/:id
   */
  async update(req: Request, res: Response) {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const { professorResponsavelId, ...dados } = req.body;

    const turma = await prisma.turma.findFirst({
      where: { id: String(id) },
      include: { _count: { select: { alunos: { where: { deletedAt: null } } } } }
    });

    if (!turma) throw new AppError('Turma não encontrada', 404);

    // Proteção de Capacidade (Não pode reduzir a capacidade para menos do que a qtd atual de alunos)
    if (dados.capacidadeMaxima && dados.capacidadeMaxima < turma._count.alunos) {
      throw new AppError(`Operação bloqueada. A turma já possui ${turma._count.alunos} alunos.`, 400);
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Atualiza os dados básicos da turma
      const turmaAtualizada = await tx.turma.update({
        where: { id: String(id) },
        data: dados
      });

      // 2. Atualiza ou cria o vínculo com o professor principal
      if (professorResponsavelId) {
        const vinculoExistente = await tx.turmaProfessor.findFirst({
          where: { turmaId: String(id), isPrincipal: true }
        });

        if (vinculoExistente) {
          await tx.turmaProfessor.update({
            where: { id: vinculoExistente.id },
            data: { professorId: professorResponsavelId }
          });
        } else {
          await tx.turmaProfessor.create({
            data: {
              turmaId: String(id),
              professorId: professorResponsavelId,
              isPrincipal: true,
              escolaId: req.user?.escolaId as string
            }
          });
        }
      }

      return turmaAtualizada;
    });

    return res.json({ status: 'success', data: resultado });
  },

  /**
   * DELETE /turmas/:id - Soft Delete Protegido
   */
  async delete(req: Request, res: Response) {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    const turma = await prisma.turma.findFirst({
      where: { id: String(id) },
      include: { _count: { select: { alunos: { where: { deletedAt: null } } } } }
    });

    if (!turma) throw new AppError('Turma não encontrada', 404);

    // Trava de Segurança Pedagógica
    if (turma._count.alunos > 0) {
      throw new AppError(`Impossível excluir. Existem ${turma._count.alunos} aluno(s) vinculados a esta turma.`, 403);
    }

    await prisma.turma.update({
      where: { id: String(id) },
      data: { deletedAt: new Date() }
    });

    return res.status(204).send();
  }
};