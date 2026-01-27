import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withEscolaId, withTenancy } from '../utils/prismaHelpers'

export const notaController = {
  async list(req: Request, res: Response) {
    const { page = 1, limit = 50, alunoId, disciplinaId, bimestre, anoLetivo } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    let where: any = {}
    if (alunoId) where.alunoId = alunoId
    if (disciplinaId) where.disciplinaId = disciplinaId
    if (bimestre) where.bimestre = Number(bimestre)
    if (anoLetivo) where.anoLetivo = Number(anoLetivo)

    where.aluno = { escolaId: req.user?.escolaId, deletedAt: null }

    const [notas, total] = await Promise.all([
      prisma.nota.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          aluno: { select: { id: true, nome: true, numeroMatricula: true } },
          disciplina: { select: { id: true, nome: true } },
        },
        orderBy: [ { bimestre: 'desc' }, {anoLetivo: 'desc'}],
      }),
      prisma.nota.count({ where }),
    ])

    return res.json({
      data: notas,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    })
  },

  async show(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const nota = await prisma.nota.findFirst({
      where: {
        id: idFormatado,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
      include: {
        aluno: { select: { nome: true, numeroMatricula: true } },
        disciplina: { select: { nome: true, cargaHoraria: true } },
      },
    })

    if (!nota) throw new AppError('Nota não encontrada', 404)
    return res.json(nota)
  },

  async create(req: Request, res: Response) {
    const dados = req.body
    const escolaId = req.user?.escolaId

    const aluno = await prisma.aluno.findFirst({
      where: withTenancy({ id: dados.alunoId }),
    })
    if (!aluno) throw new AppError('Aluno não encontrado', 404)

    const disciplina = await prisma.disciplina.findFirst({
      where: withEscolaId({ id: dados.disciplinaId }),
    })
    if (!disciplina) throw new AppError('Disciplina não encontrada', 404)

    const notaExiste = await prisma.nota.findFirst({
      where: {
        alunoId: dados.alunoId,
        disciplinaId: dados.disciplinaId,
        bimestre: dados.bimestre,
        anoLetivo: dados.anoLetivo,
      },
    })
    if (notaExiste) throw new AppError('Nota já lançada para este bimestre', 400)

    const nota = await prisma.nota.create({
      data: { ...dados, escolaId },
      include: {
        aluno: { select: { nome: true } },
        disciplina: { select: { nome: true } },
      },
    })

    return res.status(201).json(nota)
  },

  async update(req: Request, res: Response) {
    const { id } = req.params
    const dados = req.body
    const idFormatado = Array.isArray(id) ? id[0] : id

    const notaExistente = await prisma.nota.findFirst({
      where: {
        id: idFormatado,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
    })
    if (!notaExistente) throw new AppError('Nota não encontrada', 404)

    const nota = await prisma.nota.update({
      where: { id: idFormatado },
      data: dados,
      include: {
        aluno: { select: { nome: true } },
        disciplina: { select: { nome: true } },
      },
    })

    return res.json(nota)
  },

  async delete(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const nota = await prisma.nota.findFirst({
      where: {
        id: idFormatado,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
    })
    if (!nota) throw new AppError('Nota não encontrada', 404)

    await prisma.nota.delete({ where: { id: idFormatado } })
    return res.status(204).send()
  },

  async boletim(req: Request, res: Response) {
    const { alunoId } = req.params
    const { anoLetivo } = req.query
    const idFormatado = Array.isArray(alunoId) ? alunoId[0] : alunoId

    const aluno = await prisma.aluno.findFirst({
      where: withTenancy({ id: idFormatado }),
      select: {
        id: true,
        nome: true,
        numeroMatricula: true,
        turma: { select: { nome: true } },
      },
    })
    if (!aluno) throw new AppError('Aluno não encontrado', 404)

    const notas = await prisma.nota.findMany({
      where: { alunoId: idFormatado, anoLetivo: Number(anoLetivo) },
      include: {
        disciplina: { select: { nome: true, cargaHoraria: true } },
      },
      orderBy: [{ disciplina: { nome: 'asc' } }, { bimestre: 'asc' }, { anoLetivo: 'asc' }],
    })

    // Agrupar por disciplina
    const notasPorDisciplina = notas.reduce((acc: any, nota) => {
        const key = nota.disciplinaId
        

      if (!acc[key]) {
        acc[key] = {
          disciplina: nota.disciplinaId,
          notas: [],
        }
      }
      acc[key].notas.push({
        bimestre: nota.bimestre,
        valor: nota.valor,
        observacao: nota.observacao,
      })
      return acc
    }, {})

    // Calcular médias
    const boletim = Object.values(notasPorDisciplina).map((item: any) => {
      const soma = item.notas.reduce((s: number, n: any) => s + n.valor, 0)
      const media = item.notas.length > 0 ? soma / item.notas.length : 0

      return {
        disciplina: item.disciplina.nome,
        cargaHoraria: item.disciplina.cargaHoraria,
        notas: item.notas,
        media: Number(media.toFixed(2)),
        status: media >= 6 ? 'APROVADO' : media >= 4 ? 'RECUPERACAO' : 'REPROVADO',
      }
    })

    const mediaGeral = boletim.length > 0
      ? boletim.reduce((s, b) => s + b.media, 0) / boletim.length
      : 0

    return res.json({
      aluno,
      anoLetivo: Number(anoLetivo),
      boletim,
      mediaGeral: Number(mediaGeral.toFixed(2)),
      totalDisciplinas: boletim.length,
    })
  },
}