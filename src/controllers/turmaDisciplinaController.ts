import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withEscolaId } from '../utils/prismaHelpers'

export const turmaDisciplinaController = {
  async vincular(req: Request, res: Response) {
    const { turmaId } = req.params
    const { disciplinaId } = req.body
    const idFormatado = Array.isArray(turmaId) ? turmaId[0] : turmaId

    const turma = await prisma.turma.findFirst({
      where: withEscolaId({ id: idFormatado }),
    })
    if (!turma) throw new AppError('Turma não encontrada', 404)

    const disciplina = await prisma.disciplina.findFirst({
      where: withEscolaId({ id: disciplinaId }),
    })
    if (!disciplina) throw new AppError('Disciplina não encontrada', 404)

    const vinculoExiste = await prisma.turmaDisciplina.findUnique({
      where: {
        turmaId_disciplinaId: { turmaId: idFormatado, disciplinaId: idFormatado },
      },
    })
    if (vinculoExiste) throw new AppError('Já vinculado', 400)

    const vinculo = await prisma.turmaDisciplina.create({
      data: { turmaId: idFormatado, disciplinaId },
      include: {
        disciplina: { select: { id: true, nome: true, cargaHoraria: true } },
        turma: { select: { id: true, nome: true } },
      },
    })

    return res.status(201).json(vinculo)
  },

  async desvincular(req: Request, res: Response) {
    const { turmaId, disciplinaId } = req.params
    const idFormatado = Array.isArray(turmaId) ? turmaId[0] : turmaId

    const vinculo = await prisma.turmaDisciplina.findUnique({
      where: { turmaId_disciplinaId: { turmaId: idFormatado, disciplinaId: idFormatado } },
    })
    if (!vinculo) throw new AppError('Vínculo não encontrado', 404)

    const turma = await prisma.turma.findFirst({
      where: withEscolaId({ id: idFormatado }),
    })
    if (!turma) throw new AppError('Turma não encontrada', 404)

    await prisma.turmaDisciplina.delete({
      where: { turmaId_disciplinaId: { turmaId: idFormatado, disciplinaId: idFormatado } },
    })

    return res.status(204).send()
  },

  async listarDisciplinasDaTurma(req: Request, res: Response) {
    const { turmaId } = req.params
    const idFormatado = Array.isArray(turmaId) ? turmaId[0] : turmaId

    const turma = await prisma.turma.findFirst({
      where: withEscolaId({ id: idFormatado }),
    })
    if (!turma) throw new AppError('Turma não encontrada', 404)

    const disciplinas = await prisma.turmaDisciplina.findMany({
      where: { turmaId: idFormatado },
      include: {
        disciplina: {
          select: {
            id: true,
            nome: true,
            cargaHoraria: true,
            _count: { select: { notas: true } },
          },
        },
      },
      orderBy: { disciplina: { nome: 'asc' } },
    })

    return res.json({
      turma: { id: turma.id, nome: turma.nome },
      disciplinas: disciplinas.map(v => v.disciplina),
      total: disciplinas.length,
    })
  },
}