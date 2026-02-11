import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withTenancy } from '../utils/prismaHelpers'

export const rematriculaController = {
  async gerarMassa(req: Request, res: Response) {
    const { anoAnterior, anoNovo } = req.body
    const escolaId = req.user?.escolaId

    const alunos = await prisma.aluno.findMany({
      where: {
        ...withTenancy({}),
        turma: { anoLetivo: anoAnterior },
      },
      include: {
        turma: { select: { id: true, nome: true } },
        contrato: { select: { valorMensalidade: true } },
      },
    })

    if (alunos.length === 0) {
      throw new AppError('Nenhum aluno encontrado para o ano anterior informado', 400)
    }

    const existentes = await prisma.rematricula.findMany({
      where: { escolaId, anoNovo },
      select: { alunoId: true },
    })
    const alunosJaExistentes = existentes.map(e => e.alunoId)

    const rematriculasParaCriar = alunos
      .filter(a => !alunosJaExistentes.includes(a.id))
      .map(a => ({
        alunoId: a.id,
        anoAnterior,
        anoNovo,
        turmaAnteriorId: a.turma!.id,
        valorAnterior: a.contrato?.valorMensalidade || 0,
        valorNovo: a.contrato?.valorMensalidade || 0,
        escolaId: escolaId!,
        status: 'PENDENTE' as const,
      }))

    const resultado = await prisma.rematricula.createMany({
      data: rematriculasParaCriar,
      skipDuplicates: true,
    })

    return res.status(201).json({
      message: `${resultado.count} rematrícula(s) gerada(s)`,
      totalAlunos: alunos.length,
      totalGeradas: resultado.count,
      jaExistentes: alunosJaExistentes.length,
    })
  },

  async confirmar(req: Request, res: Response) {
    const id = req.params as {id: string};
    const { turmaNovaId, valorNovo, observacoes } = req.body

    // Melhoria: Uso de Transaction para garantir que o status só mude se tudo der certo
    const resultado = await prisma.$transaction(async (tx) => {
      const rematricula = await tx.rematricula.update({
        where: id ,
        data: {
          status: 'CONFIRMADA',
          observacoes,
          dataConfirmacao: new Date()
        }
      })

      // Se houver turma nova, já vincula o aluno para o próximo ano
      if (turmaNovaId) {
        await tx.aluno.update({
          where: { id: rematricula.alunoId },
          data: { turmaId: turmaNovaId }
        })
      }

      return rematricula
    })

    return res.json(resultado)
  },

  async recusar(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id
    const { observacoes } = req.body || {}

    const rematricula = await prisma.rematricula.findFirst({
      where: { id: idFormatado, escola: { id: req.user?.escolaId } },
    })

    if (!rematricula) throw new AppError('Rematrícula não encontrada', 404)
    if (rematricula.status !== 'PENDENTE') throw new AppError('Rematrícula não está pendente', 400)

    const atualizada = await prisma.rematricula.update({
      where: { id: idFormatado },
      data: { status: 'RECUSADA', observacoes },
    })

    return res.json({ message: 'Rematrícula recusada', rematricula: atualizada })
  },

  async list(req: Request, res: Response) {
    const { page = 1, limit = 20, status, anoNovo } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    let where: any = { escolaId: req.user?.escolaId }
    if (status) where.status = status
    if (anoNovo) where.anoNovo = Number(anoNovo)

    const [rematriculas, total] = await Promise.all([
      prisma.rematricula.findMany({
        where,
        skip,
        take: Number(limit),
        include: { aluno: { select: { nome: true, numeroMatricula: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rematricula.count({ where }),
    ])

    return res.json({
      data: rematriculas,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    })
  },

  async show(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const rematricula = await prisma.rematricula.findFirst({
      where: { id: idFormatado, escola: { id: req.user?.escolaId } },
      include: {
        aluno: {
          select: {
            nome: true,
            numeroMatricula: true,
            turma: { select: { nome: true } },
          },
        },
      },
    })

    if (!rematricula) throw new AppError('Rematrícula não encontrada', 404)
    return res.json(rematricula)
  },

  async estatisticas(req: Request, res: Response) {
    const { anoNovo } = req.query
    const escolaId = req.user?.escolaId

    let where: any = { escolaId }
    if (anoNovo) where.anoNovo = Number(anoNovo)

    const porStatus = await prisma.rematricula.groupBy({
      by: ['status'],
      where,
      _count: true,
    })

    const total = await prisma.rematricula.count({ where })
    const confirmadas = await prisma.rematricula.count({
      where: { ...where, status: 'CONFIRMADA' }
    })

    return res.json({
      total,
      porStatus,
      taxaRetencao: total > 0 ? `${((confirmadas / total) * 100).toFixed(2)}%` : "0%"
    })
  },
}