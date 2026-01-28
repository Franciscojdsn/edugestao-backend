import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'

export const enderecoController = {
  async list(req: Request, res: Response) {
    const enderecos = await prisma.endereco.findMany({
      select: {
        id: true,
        rua: true,
        numero: true,
        bairro: true,
        cidade: true,
        estado: true,
        cep: true,
        _count: {
          select: {
            alunos: true,
            responsaveis: true,
            funcionarios: true,
          },
        },
      },
      orderBy: { cidade: 'asc' },
    })

    return res.json({ data: enderecos, total: enderecos.length })
  },

  async show(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const endereco = await prisma.endereco.findUnique({
      where: { id: idFormatado },
      include: {
        alunos: {
          select: {
            id: true,
            nome: true,
            numeroMatricula: true,
          },
        },
        responsaveis: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
        funcionarios: {
          select: {
            id: true,
            nome: true,
            cargo: true,
          },
        },
      },
    })

    if (!endereco) throw new AppError('Endereço não encontrado', 404)
    return res.json(endereco)
  },

  async create(req: Request, res: Response) {
    const dados = req.body

    const endereco = await prisma.endereco.create({
      data: dados,
    })

    return res.status(201).json(endereco)
  },

  async update(req: Request, res: Response) {
    const { id } = req.params
    const dados = req.body
    const idFormatado = Array.isArray(id) ? id[0] : id

    const enderecoExistente = await prisma.endereco.findUnique({
      where: { id: idFormatado },
    })
    if (!enderecoExistente) throw new AppError('Endereço não encontrado', 404)

    const endereco = await prisma.endereco.update({
      where: { id: idFormatado },
      data: dados,
    })

    return res.json(endereco)
  },

  async delete(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const endereco = await prisma.endereco.findUnique({
      where: { id: idFormatado },
      include: {
        _count: {
          select: {
            alunos: true,
            responsaveis: true,
            funcionarios: true,
          },
        },
      },
    })
    if (!endereco) throw new AppError('Endereço não encontrado', 404)

    const total = endereco._count.alunos + endereco._count.responsaveis + endereco._count.funcionarios
    if (total > 0) {
      throw new AppError(`Não é possível deletar endereço vinculado a ${total} registro(s)`, 400)
    }

    await prisma.endereco.delete({ where: { id: idFormatado } })
    return res.status(204).send()
  },

  async buscarPorCep(req: Request, res: Response) {
    const { cep } = req.params
    const cepFormatado = Array.isArray(cep) ? cep[0] : cep

    const enderecos = await prisma.endereco.findMany({
      where: { cep: cepFormatado },
    })

    return res.json({ data: enderecos, total: enderecos.length })
  },
}