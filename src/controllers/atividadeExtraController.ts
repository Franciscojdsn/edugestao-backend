import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withEscolaId, withTenancy } from '../utils/prismaHelpers'

export const atividadeExtraController = {
  async list(req: Request, res: Response) {
    const atividades = await prisma.atividadeExtra.findMany({
      where: withEscolaId({}),
      select: {
        id: true,
        nome: true,
        descricao: true,
        valor: true,
        diaAula: true,
        horario: true,
        capacidadeMaxima: true,
        createdAt: true,
        _count: { select: { alunos: true } },
      },
      orderBy: { nome: 'asc' },
    })

    const atividadesComVagas = atividades.map(a => ({
      ...a,
      totalAlunos: a._count.alunos,
      vagas: a.capacidadeMaxima ? a.capacidadeMaxima - a._count.alunos : null,
    }))

    return res.json({ data: atividadesComVagas, total: atividades.length })
  },

  async show(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const atividade = await prisma.atividadeExtra.findFirst({
      where: withEscolaId({ id: idFormatado }),
      include: {
        alunos: {
          include: {
            aluno: {
              select: {
                id: true,
                nome: true,
                numeroMatricula: true,
                turma: { select: { nome: true } },
              },
            },
          },
        },
        _count: { select: { alunos: true } },
      },
    })

    if (!atividade) throw new AppError('Atividade não encontrada', 404)
    return res.json(atividade)
  },

  async create(req: Request, res: Response) {
    const dados = req.body
    const escolaId = req.user?.escolaId

    const atividadeExiste = await prisma.atividadeExtra.findFirst({
      where: withEscolaId({ nome: dados.nome }),
    })
    if (atividadeExiste) throw new AppError('Atividade com este nome já existe', 400)

    const atividade = await prisma.atividadeExtra.create({
      data: { ...dados, escolaId },
    })

    return res.status(201).json(atividade)
  },

  async update(req: Request, res: Response) {
    const { id } = req.params
    const dados = req.body
    const idFormatado = Array.isArray(id) ? id[0] : id

    const atividadeExistente = await prisma.atividadeExtra.findFirst({
      where: withEscolaId({ id: idFormatado }),
    })
    if (!atividadeExistente) throw new AppError('Atividade não encontrada', 404)

    if (dados.nome && dados.nome !== atividadeExistente.nome) {
      const nomeEmUso = await prisma.atividadeExtra.findFirst({
        where: withEscolaId({ nome: dados.nome, id: { not: idFormatado } }),
      })
      if (nomeEmUso) throw new AppError('Nome já está em uso', 400)
    }

    const atividade = await prisma.atividadeExtra.update({
      where: { id: idFormatado },
      data: dados,
    })

    return res.json(atividade)
  },

  async delete(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const atividade = await prisma.atividadeExtra.findFirst({
      where: withEscolaId({ id: idFormatado }),
      include: { _count: { select: { alunos: true } } },
    })
    if (!atividade) throw new AppError('Atividade não encontrada', 404)

    if (atividade._count.alunos > 0) {
      throw new AppError(
        `Não é possível deletar atividade com ${atividade._count.alunos} aluno(s) matriculado(s)`,
        400
      )
    }

    await prisma.atividadeExtra.delete({ where: { id: idFormatado } })
    return res.status(204).send()
  },

  async vincularAluno(req: Request, res: Response) {
    const { atividadeId } = req.params
    const { alunoId } = req.body
    const idFormatado = Array.isArray(alunoId) ? alunoId[0] : alunoId
    const _idFormatado = Array.isArray(atividadeId) ? atividadeId[0] : atividadeId

    const atividade = await prisma.atividadeExtra.findFirst({
      where: withEscolaId({ id: _idFormatado }),
      include: { _count: { select: { alunos: true } } },
    })
    if (!atividade) throw new AppError('Atividade não encontrada', 404)

    const aluno = await prisma.aluno.findFirst({
      where: withTenancy({ id: idFormatado }),
    })
    if (!aluno) throw new AppError('Aluno não encontrado', 404)

    const vinculoExiste = await prisma.alunoAtividadeExtra.findUnique({
      where: { alunoId_atividadeExtraId: { alunoId: idFormatado, atividadeExtraId: _idFormatado } },
    })
    if (vinculoExiste) throw new AppError('Aluno já matriculado nesta atividade', 400)

    if (atividade.capacidadeMaxima && atividade._count.alunos >= atividade.capacidadeMaxima) {
      throw new AppError('Atividade já está com capacidade máxima', 400)
    }

    const vinculo = await prisma.alunoAtividadeExtra.create({
      data: { alunoId: idFormatado, atividadeExtraId: _idFormatado },
      include: {
        aluno: { select: { nome: true, numeroMatricula: true } },
        atividadeExtra: { select: { nome: true, valor: true } },
      },
    })

    return res.status(201).json(vinculo)
  },

  async desvincularAluno(req: Request, res: Response) {
    const { atividadeId, alunoId } = req.params
    const idFormatado = Array.isArray(atividadeId) ? atividadeId[0] : atividadeId
    const _idFormatado = Array.isArray(alunoId) ? alunoId[0] : alunoId


    const vinculo = await prisma.alunoAtividadeExtra.findUnique({
      where: { alunoId_atividadeExtraId: { alunoId: _idFormatado, atividadeExtraId: idFormatado } },
    })
    if (!vinculo) throw new AppError('Vínculo não encontrado', 404)

    await prisma.alunoAtividadeExtra.delete({
      where: { alunoId_atividadeExtraId: { alunoId: _idFormatado, atividadeExtraId: idFormatado } },
    })

    return res.status(204).send()
  },

  async alunosDaAtividade(req: Request, res: Response) {
    const { atividadeId } = req.params
    const idFormatado = Array.isArray(atividadeId) ? atividadeId[0] : atividadeId

    const atividade = await prisma.atividadeExtra.findFirst({
      where: withEscolaId({ id: idFormatado }),
    })
    if (!atividade) throw new AppError('Atividade não encontrada', 404)

    const alunos = await prisma.alunoAtividadeExtra.findMany({
      where: { atividadeExtraId: idFormatado },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            numeroMatricula: true,
            turma: { select: { nome: true } },
          },
        },
      },
      orderBy: { aluno: { nome: 'asc' } },
    })

    return res.json({
      atividade: { id: atividade.id, nome: atividade.nome },
      alunos: alunos.map(v => v.aluno),
      total: alunos.length,
    })
  },
}