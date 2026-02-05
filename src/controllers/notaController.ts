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

    where.aluno = { escolaId: req.user?.escolaId, deletedAt: { equals: null } }

    const [notas, total] = await Promise.all([
      prisma.nota.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          aluno: { select: { id: true, nome: true, numeroMatricula: true } },
          disciplina: { select: { id: true, nome: true, cargaHoraria: true } }, // ALTERAÇÃO: Adicionado cargaHoraria no select para corrigir o erro ts(2339)
        },
        orderBy: [{ bimestre: 'desc' }, { anoLetivo: 'desc' }],
      }),
      prisma.nota.count({ where }),
    ])

    const notasPorDisciplina = notas.reduce((acc: any, nota) => {
      const key = nota.disciplinaId
      if (!acc[key]) {
        acc[key] = {
          disciplina: nota.disciplina.nome,
          cargaHoraria: nota.disciplina.cargaHoraria || 0,
          notas: [],
        }
      }
      acc[key].notas.push({
        bimestre: nota.bimestre,
        valor: Number(nota.valor),
        observacao: nota.observacao,
      })
      return acc
    }, {})

    const boletim = Object.values(notasPorDisciplina).map((item: any) => {
      const soma = item.notas.reduce((s: number, n: any) => s + n.valor, 0)
      const media = item.notas.length > 0 ? soma / item.notas.length : 0

      return {
        ...item,
        media: Number(media.toFixed(2)),
        status: media >= 6 ? 'APROVADO' : media >= 4 ? 'RECUPERACAO' : 'REPROVADO',
      }
    })

    return res.json({ total, boletim, listaCompleta: notas })
  },

  async create(req: Request, res: Response) {
    const { alunoId, disciplinaId, turmaId, bimestre, anoLetivo, valor, observacao } = req.body // ALTERAÇÃO: Adicionado turmaId
    const escolaId = req.user?.escolaId

    const notaExistente = await prisma.nota.findFirst({
        where: { alunoId, disciplinaId, bimestre, anoLetivo, aluno: { escolaId } }
    })
    if (notaExistente) throw new AppError('Já existe uma nota registrada para este aluno neste bimestre', 400)

    // CORREÇÃO ts(2322): Usando o formato connect para relacionamentos no Prisma
    const nota = await prisma.nota.create({
      data: {
        valor: Number(valor),
        bimestre: Number(bimestre),
        anoLetivo: Number(anoLetivo),
        observacao,
        aluno: { connect: { id: alunoId } }, // ALTERAÇÃO: Uso do connect em vez de ID solto
        disciplina: { connect: { id: disciplinaId } }, // ALTERAÇÃO: Uso do connect
        turma: { connect: { id: turmaId } }, // ALTERAÇÃO: Necessário vincular à turma no schema
      },
    })

    return res.status(201).json(nota)
  }
}