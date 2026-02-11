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
      if (dados.gravidade === 'GRAVE' || dados.gravidade === 'GRAVISSIMA') {
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

  async estatisticas(req: Request, res: Response) {
    const escolaId = req.user?.escolaId;
    const { dataInicio, dataFim } = req.query;

    // Filtro de data opcional
    const filtroData: any = {};
    if (dataInicio || dataFim) {
      filtroData.data = {};
      if (dataInicio) filtroData.data.gte = new Date(dataInicio as string);
      if (dataFim) filtroData.data.lte = new Date(dataFim as string);
    }

    const [porGravidade, porTipo, totalRecentes] = await Promise.all([
      // Agrupado por Gravidade
      prisma.ocorrencia.groupBy({
        by: ['gravidade'],
        where: { escolaId, ...filtroData },
        _count: true,
      }),
      // Agrupado por Tipo
      prisma.ocorrencia.groupBy({
        by: ['tipo'],
        where: { escolaId, ...filtroData },
        _count: true,
      }),
      // Total Geral
      prisma.ocorrencia.count({
        where: { escolaId, ...filtroData }
      })
    ]);

    return res.json({
      total: totalRecentes,
      gravidade: porGravidade.map(g => ({ label: g.gravidade, qtd: g._count })),
      tipos: porTipo.map(t => ({ label: t.tipo, qtd: t._count }))
    });
  }
}