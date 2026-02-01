import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'

function getEscalation(diasVencidos: number) {
  if (diasVencidos <= 5) {
    return {
      nivel: 'LEMBRETE',
      prioridade: 'NORMAL',
      mensagem: 'Lembramos que sua mensalidade está vencida. Por favor, regularize sua situação financeira.',
    }
  } else if (diasVencidos <= 15) {
    return {
      nivel: 'AVISO',
      prioridade: 'ALTA',
      mensagem: 'Sua mensalidade está vencida há mais de 5 dias. Por favor, regularize urgentemente.',
    }
  } else if (diasVencidos <= 30) {
    return {
      nivel: 'AVISO_FORMAL',
      prioridade: 'URGENTE',
      mensagem: 'Aviso formal: sua mensalidade está vencida há mais de 15 dias. A pendência pode afetar a continuidade da matrícula.',
    }
  }
  return {
    nivel: 'CRITICO',
    prioridade: 'URGENTE',
    mensagem: 'ATENÇÃO: sua mensalidade está vencida há mais de 30 dias. Entre em contato urgentemente com a escola.',
  }
}

export const reguaCobracaController = {
  async verificarPendencias(req: Request, res: Response) {
    const escolaId = req.user?.escolaId
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const pagamentosVencidos = await prisma.pagamento.findMany({
      where: {
        status: 'PENDENTE',
        dataVencimento: { lt: hoje },
        aluno: { escolaId, deletedAt: null },
      },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            numeroMatricula: true,
            responsaveis: {
              where: { isResponsavelFinanceiro: true },
              select: { nome: true, telefone1: true, email: true },
            },
          },
        },
      },
      orderBy: { dataVencimento: 'asc' },
    })

    const pendencias = pagamentosVencidos.map(pag => {
      const diasVencidos = Math.floor(
        (hoje.getTime() - pag.dataVencimento.getTime()) / (1000 * 60 * 60 * 24)
      )
      const escalation = getEscalation(diasVencidos)

      return {
        pagamento: {
          id: pag.id,
          referencia: pag.referencia,
          valorTotal: pag.valorTotal,
          dataVencimento: pag.dataVencimento,
        },
        aluno: pag.aluno,
        diasVencidos,
        ...escalation,
      }
    })

    const resumo = {
      total: pendencias.length,
      lembrete: pendencias.filter(p => p.nivel === 'LEMBRETE').length,
      aviso: pendencias.filter(p => p.nivel === 'AVISO').length,
      avisoFormal: pendencias.filter(p => p.nivel === 'AVISO_FORMAL').length,
      critico: pendencias.filter(p => p.nivel === 'CRITICO').length,
      valorTotalPendente: Number(
        pendencias.reduce((s, p) => s + Number(p.pagamento.valorTotal), 0).toFixed(2)
      ),
    }

    return res.json({ resumo, pendencias })
  },

  async gerarNotificacoes(req: Request, res: Response) {
    const escolaId = req.user?.escolaId
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const pagamentosVencidos = await prisma.pagamento.findMany({
      where: {
        status: 'PENDENTE',
        dataVencimento: { lt: hoje },
        aluno: { escolaId, deletedAt: null },
      },
      include: { aluno: { select: { id: true, nome: true } } },
    })

    let totalNotificacoes = 0

    for (const pag of pagamentosVencidos) {
      const diasVencidos = Math.floor(
        (hoje.getTime() - pag.dataVencimento.getTime()) / (1000 * 60 * 60 * 24)
      )
      const escalation = getEscalation(diasVencidos)

      // Evitar duplicatas do mesmo dia
      const existente = await prisma.comunicado.findFirst({
        where: {
          alunoId: pag.aluno.id,
          titulo: { contains: pag.referencia },
          dataEnvio: { gte: new Date(hoje) },
        },
      })

      if (!existente) {
        await prisma.comunicado.create({
          data: {
            titulo: `Mensalidade Vencida - ${pag.referencia}`,
            mensagem: escalation.mensagem,
            tipo: 'FINANCEIRO',
            prioridade: escalation.prioridade as any,
            escolaId: escolaId!,
            alunoId: pag.aluno.id,
          },
        })
        totalNotificacoes++
      }
    }

    return res.json({
      message: `${totalNotificacoes} notificação(s) gerada(s)`,
      totalNotificacoes,
      totalPagamentosVencidos: pagamentosVencidos.length,
    })
  },

  async resumoPendencias(req: Request, res: Response) {
    const escolaId = req.user?.escolaId
    const { alunoId, turmaId } = req.query
    const hoje = new Date()

    let whereAluno: any = { escolaId, deletedAt: null }
    if (alunoId) whereAluno.id = alunoId
    if (turmaId) whereAluno.turmaId = turmaId

    const [totalReceita, totalPago, totalPendente, totalVencido] = await Promise.all([
      prisma.pagamento.aggregate({
        where: { aluno: whereAluno },
        _sum: { valorTotal: true },
      }),
      prisma.pagamento.aggregate({
        where: { aluno: whereAluno, status: 'PAGO' },
        _sum: { valorPago: true },
      }),
      prisma.pagamento.aggregate({
        where: { aluno: whereAluno, status: 'PENDENTE', dataVencimento: { gte: hoje } },
        _sum: { valorTotal: true },
      }),
      prisma.pagamento.aggregate({
        where: { aluno: whereAluno, status: 'PENDENTE', dataVencimento: { lt: hoje } },
        _sum: { valorTotal: true },
      }),
    ])

    const receita = Number(totalReceita._sum.valorTotal || 0)
    const pago = Number(totalPago._sum.valorPago || 0)
    const pendente = Number(totalPendente._sum.valorTotal || 0)
    const vencido = Number(totalVencido._sum.valorTotal || 0)

    return res.json({
      resumo: {
        totalReceita: Number(receita.toFixed(2)),
        valorPago: Number(pago.toFixed(2)),
        valorPendente: Number(pendente.toFixed(2)),
        valorVencido: Number(vencido.toFixed(2)),
        taxaRecebimento: receita > 0 ? Number(((pago / receita) * 100).toFixed(2)) : 0,
        valorEmRisco: Number(vencido.toFixed(2)),
      },
    })
  },

  async escalonarPagamento(req: Request, res: Response) {
    const { pagamentoId } = req.params
    const idFormatado = Array.isArray(pagamentoId) ? pagamentoId[0] : pagamentoId

    const pagamento = await prisma.pagamento.findFirst({
      where: {
        id: idFormatado,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
      include: { aluno: { select: { id: true, nome: true } } },
    })

    if (!pagamento) throw new AppError('Pagamento não encontrado', 404)

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const diasVencidos = Math.max(0, Math.floor(
      (hoje.getTime() - pagamento.dataVencimento.getTime()) / (1000 * 60 * 60 * 24)
    ))

    // Força próximo nível
    let nivel: string
    if (diasVencidos <= 5) nivel = 'AVISO'
    else if (diasVencidos <= 15) nivel = 'AVISO_FORMAL'
    else nivel = 'CRITICO'

    const mensagens: any = {
      AVISO: 'Aviso: sua mensalidade está pendente. Por favor, regularize urgentemente.',
      AVISO_FORMAL: 'Aviso formal: pendência financeira não regularizada. A matrícula pode ser afetada.',
      CRITICO: 'ATENÇÃO CRÍTICO: pendência financeira grave. Entre em contato IMEDIATAMENTE com a escola.',
    }

    await prisma.comunicado.create({
      data: {
        titulo: `[ESCALADO] Mensalidade - ${pagamento.referencia}`,
        mensagem: mensagens[nivel],
        tipo: 'FINANCEIRO',
        prioridade: nivel === 'CRITICO' ? 'URGENTE' : 'ALTA',
        escolaId: req.user?.escolaId!,
        alunoId: pagamento.aluno.id,
      },
    })

    return res.json({
      message: 'Pagamento escalado',
      pagamento: { id: pagamento.id, referencia: pagamento.referencia, valorTotal: pagamento.valorTotal },
      nivel,
      diasVencidos,
    })
  },
}