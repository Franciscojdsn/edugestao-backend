import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'

export const portalResponsavelController = {
  async meusDados(req: Request, res: Response) {
    const { responsavelId } = req.query
    const idFormatado = Array.isArray(responsavelId) ? responsavelId[0] : responsavelId
    if (!idFormatado) throw new AppError('ID do responsável é obrigatório', 400)

    const responsavel = await prisma.responsavel.findFirst({
      where: {
        id: idFormatado as string,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
      include: {
        aluno: {
          include: {
            turma: { select: { nome: true, anoLetivo: true } },
            escola: { select: { nome: true } },
            endereco: true,
          },
        },
      },
    })

    if (!responsavel) throw new AppError('Responsável não encontrado', 404)

    return res.json({
      responsavel: {
        nome: responsavel.nome,
        tipo: responsavel.tipo,
        telefone1: responsavel.telefone1,
        email: responsavel.email,
      },
      filho: {
        nome: responsavel.aluno.nome,
        numeroMatricula: responsavel.aluno.numeroMatricula,
        turma: responsavel.aluno.turma,
        escola: responsavel.aluno.escola,
        endereco: responsavel.aluno.endereco,
      },
    })
  },

  async resumoFinanceiro(req: Request, res: Response) {
    const { responsavelId } = req.query
    const idFormatado = Array.isArray(responsavelId) ? responsavelId[0] : responsavelId
    if (!idFormatado) throw new AppError('ID do responsável é obrigatório', 400)

    const responsavel = await prisma.responsavel.findFirst({
      where: {
        id: idFormatado as string,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
      include: { aluno: { select: { id: true, nome: true } } },
    })
    if (!responsavel) throw new AppError('Responsável não encontrado', 404)

    const pagamentos = await prisma.boletos.findMany({
      where: { alunoId: responsavel.aluno.id },
      select: { referencia: true, valorTotal: true, valorPago: true, status: true, dataVencimento: true, dataPagamento: true },
      orderBy: { dataVencimento: 'desc' },
    })

    const totalPago = pagamentos.filter(p => p.status === 'PAGO').reduce((s, p) => s + Number(p.valorPago || 0), 0)
    const totalPendente = pagamentos
      .filter(p => p.status === 'PENDENTE' || p.status === 'VENCIDO')
      .reduce((s, p) => s + Number(p.valorTotal), 0)

    return res.json({
      aluno: responsavel.aluno,
      resumo: {
        totalPagamentos: pagamentos.length,
        totalPago: Number(totalPago.toFixed(2)),
        totalPendente: Number(totalPendente.toFixed(2)),
        situacaoFinanceira: totalPendente > 0 ? 'PENDENTE' : 'REGULAR',
      },
      pagamentos,
    })
  },

  async comunicados(req: Request, res: Response) {
    const { responsavelId } = req.query
    const idFormatado = Array.isArray(responsavelId) ? responsavelId[0] : responsavelId
    if (!idFormatado) throw new AppError('ID do responsável é obrigatório', 400)

    const responsavel = await prisma.responsavel.findFirst({
      where: {
        id: idFormatado as string,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
      include: { aluno: { select: { id: true, nome: true } } },
    })
    if (!responsavel) throw new AppError('Responsável não encontrado', 404)

    const comunicados = await prisma.comunicado.findMany({
      where: { alunoId: responsavel.aluno.id },
      orderBy: [{ lido: 'asc' }, { dataEnvio: 'desc' }],
    })

    return res.json({
      aluno: responsavel.aluno,
      total: comunicados.length,
      naoLidos: comunicados.filter(c => !c.lido).length,
      comunicados,
    })
  },

  async historicoAcademico(req: Request, res: Response) {
    const { responsavelId } = req.query
    const idFormatado = Array.isArray(responsavelId) ? responsavelId[0] : responsavelId
    if (!idFormatado) throw new AppError('ID do responsável é obrigatório', 400)

    const responsavel = await prisma.responsavel.findFirst({
      where: {
        id: idFormatado as string,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
      include: { aluno: { select: { id: true, nome: true, numeroMatricula: true } } },
    })
    if (!responsavel) throw new AppError('Responsável não encontrado', 404)

    const notas = await prisma.nota.findMany({
      where: { alunoId: responsavel.aluno.id },
      include: { disciplina: { select: { nome: true } } },
      orderBy: [{ anoLetivo: 'desc' }, { bimestre: 'asc' }],
    })


    const porDisciplina: any = {}
    notas.forEach(nota => {
      const key = nota.disciplina.nome
      if (!porDisciplina[key]) porDisciplina[key] = { notas: [], soma: 0, total: 0 }
      porDisciplina[key].notas.push({ bimestre: nota.bimestre, valor: Number(nota.valor), anoLetivo: nota.anoLetivo })
      porDisciplina[key].soma += Number(nota.valor)
      porDisciplina[key].total++
    })

    const disciplinas = Object.keys(porDisciplina).map(nome => {
      const media = porDisciplina[nome].total > 0 ? porDisciplina[nome].soma / porDisciplina[nome].total : 0
      return {
        disciplina: nome,
        media: Number(media.toFixed(2)),
        situacao: media >= 6 ? 'APROVADO' : 'EM RISCO',
        notas: porDisciplina[nome].notas,
      }
    })

    const frequencias = await prisma.frequencia.findMany({ where: { alunoId: responsavel.aluno.id } })
    const totalDias = frequencias.length
    const presencas = frequencias.filter(f => f.presente).length

    const notasAgrupadas = {
      1: notas.filter(n => n.bimestre === 1),
      2: notas.filter(n => n.bimestre === 2),
      3: notas.filter(n => n.bimestre === 3),
      4: notas.filter(n => n.bimestre === 4),
    }

    return res.json({
      aluno: responsavel.aluno.nome,
      boletim: notasAgrupadas,
      frequencia: {
        totalDias,
        presencas,
        percentualPresenca: totalDias > 0 ? ((presencas / totalDias) * 100).toFixed(2) : 0
      }
    })
  },

  async eventos(req: Request, res: Response) {
    const { responsavelId } = req.query
    const idFormatado = Array.isArray(responsavelId) ? responsavelId[0] : responsavelId
    if (!idFormatado) throw new AppError('ID do responsável é obrigatório', 400)

    const responsavel = await prisma.responsavel.findFirst({
      where: {
        id: idFormatado as string,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
      include: { aluno: { select: { id: true, nome: true, turmaId: true } } },
    })
    if (!responsavel) throw new AppError('Responsável não encontrado', 404)

    const hoje = new Date()

    const eventos = await prisma.evento.findMany({
      where: {
        escolaId: req.user?.escolaId,
        publico: true,
        dataInicio: { gte: hoje },
        OR: [
          { turmaId: responsavel.aluno.turmaId },
          { turmaId: null },
        ],
      },
      orderBy: { dataInicio: 'asc' },
      take: 20,
    })

    return res.json({
      aluno: responsavel.aluno,
      totalEventos: eventos.length,
      eventos,
    })
  },
}