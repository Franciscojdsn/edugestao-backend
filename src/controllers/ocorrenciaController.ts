import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withTenancy, withEscolaId } from '../utils/prismaHelpers'

export const ocorrenciaController = {
  async create(req: Request, res: Response) {
    const dados = req.body
    const escolaId = req.user?.escolaId

    const [aluno, funcionario] = await Promise.all([
      prisma.aluno.findFirst({ where: withTenancy({ id: dados.alunoId }) }),
      prisma.funcionario.findFirst({ where: withEscolaId({ id: dados.funcionarioId }) })
    ])

    if (!aluno || !funcionario) throw new AppError('Aluno ou Funcionário não encontrado', 404)

    // Alteração: Criação da ocorrência dentro de uma transação
    const ocorrencia = await prisma.$transaction(async (tx) => {
      const novo = await tx.ocorrencia.create({
        data: {
          ...dados,
          data: dados.data ? new Date(dados.data) : new Date(),
          escolaId: escolaId!,
        }
      })

      // Novo: Gatilho de Notificação Automática para ocorrências GRAVES
      if (dados.gravidade === 'GRAVE' || dados.gravidade === 'CRITICA') {
        await tx.comunicado.create({
          data: {
            titulo: `Ocorrência Disciplinar: ${dados.titulo}`,
            mensagem: `Prezados, informamos um registro de ocorrência grave para o aluno ${aluno.nome}. Por favor, compareçam à escola.`,
            tipo: 'PEDAGOGICO',
            prioridade: 'URGENTE',
            alunoId: aluno.id,
            escolaId: escolaId!
          }
        })
      }
      return novo
    })

    return res.status(201).json(ocorrencia)
  },

  async estatisticas(req: Request, res: Response) { // Novo: Método para Dashboard Pedagógico
    const escolaId = req.user?.escolaId

    const stats = await prisma.ocorrencia.groupBy({
      by: ['tipo', 'gravidade'],
      where: { escolaId },
      _count: true
    })

    return res.json(stats)
  }
}