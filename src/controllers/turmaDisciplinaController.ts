import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'

export const turmaDisciplinaController = {
  /**
   * POST /turmas/:turmaId/disciplinas
   * Vincula uma disciplina à turma e define qual professor a lecionará ali.
   */
  async vincular(req: Request, res: Response) {
    const turmaId = req.params.turmaId as string;
    const { disciplinaId, professorId } = req.body as any; // professorId agora é essencial
    const escolaId = req.user?.escolaId;

    // 1. Validar se a Turma pertence à escola
    const turma = await prisma.turma.findFirst({
      where: { id: turmaId, escolaId },
    });
    if (!turma) throw new AppError('Turma não encontrada', 404);

    // 2. Validar se a Disciplina pertence à escola
    const disciplina = await prisma.disciplina.findFirst({
      where: { id: disciplinaId, escolaId },
    });
    if (!disciplina) throw new AppError('Disciplina não encontrada', 404);

    // 3. Validar se o Professor pertence à escola
    const professor = await prisma.funcionario.findFirst({
      where: { id: professorId, escolaId },
    });
    if (!professor) throw new AppError('Professor não encontrado nesta escola', 404);

    // 4. Criar ou atualizar o vínculo
    const vinculo = await prisma.turmaDisciplina.upsert({
      where: {
        turmaId_disciplinaId: { turmaId, disciplinaId },
      },
      update: { professorId },
      create: {
        turmaId,
        disciplinaId,
        professorId
      },
      include: {
        disciplina: { select: { nome: true } },
        professor: { select: { nome: true } }
      }
    });

    return res.status(201).json(vinculo);
  },

  async listarDisciplinasDaTurma(req: Request, res: Response) {
    const turmaId = req.params.turmaId as string;
    const escolaId = req.user?.escolaId ; 

    const disciplinas = await prisma.turmaDisciplina.findMany({
      where: {
        turmaId,
        turma: { escolaId } // Segurança Multi-tenancy
      },
      include: {
        disciplina: { select: { id: true, nome: true, cargaHoraria: true } },
        professor: { select: { id: true, nome: true } } // Mostra quem leciona cada uma
      },
      orderBy: { disciplina: { nome: 'asc' } }
    });

    return res.json(disciplinas);
  },

  async desvincular(req: Request, res: Response) {
    // Use o "as string" para garantir o tipo único
    const turmaId = req.params.turmaId as string;
    const disciplinaId = req.params.disciplinaId as string;
    const escolaId = req.user?.escolaId;

    const vinculo = await prisma.turmaDisciplina.findFirst({
      where: {
        turmaId,
        disciplinaId,
        turma: { escolaId }
      }
    });

    if (!vinculo) throw new AppError('Vínculo não encontrado', 404);

    await prisma.turmaDisciplina.delete({
      where: { id: vinculo.id }
    });

    return res.status(204).send();
  }
}