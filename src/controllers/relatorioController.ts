import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { withEscolaId, withTenancy } from '../utils/prismaHelpers'

export const relatorioController = {

  // Relatório Financeiro
  async financeiro(req: Request, res: Response) {
    const { mes, ano } = req.query
    const escolaId = req.user?.escolaId
    const hoje = new Date()

    let whereData: any = {}

    if (mes && ano) {
      const dataInicio = new Date(Number(ano), Number(mes) - 1, 1)
      const dataFim = new Date(Number(ano), Number(mes), 0, 23, 59, 59)
      whereData = {
        dataVencimento: { gte: dataInicio, lte: dataFim },
      }
    }

    const boletos = await prisma.boletos.findMany({
      where: {
        ...whereData,
        aluno: { escolaId, deletedAt: null },
        deletedAt: null
      },
      select: {
        status: true,
        valorTotal: true,
        valorPago: true,
        dataVencimento: true,
      },
    })

    // 2. [NOVO] Buscar Lançamentos (Entradas Avulsas e Despesas)
    const lancamentos = await prisma.lancamento.findMany({
      where: {
        ...whereData,
        escolaId,
        deletedAt: null
      },
      select: { tipo: true, status: true, valor: true }
    })

    const resumoBoletos = boletos.reduce(
      (acc, boleto) => {
        const valor = Number(boleto.valorTotal)
        acc.total++
        acc.valorGerado += valor

        if (boleto.status === 'PAGO') {
          acc.qtdPagos++
          acc.valorRecebido += Number(boleto.valorPago || 0)
        } else {
          // PENDENTE ou VENCIDO
          const vencimento = new Date(boleto.dataVencimento)
          if (boleto.status === 'VENCIDO' || (boleto.status === 'PENDENTE' && vencimento < hoje)) {
            acc.qtdVencidos++
            acc.valorVencido += valor
          } else {
            acc.qtdPendentes++
            acc.valorPendente += valor
          }
        }
        return acc
      },
      {
        total: 0,
        qtdPagos: 0,
        qtdPendentes: 0,
        qtdVencidos: 0,
        valorGerado: 0,
        valorRecebido: 0,
        valorVencido: 0,
        valorPendente: 0
      }
    )

    // 3. [NOVO] Processar Entradas e Saídas Avulsas
    const fluxoCaixa = lancamentos.reduce((acc, lanc) => {
      const valor = Number(lanc.valor)

      if (lanc.tipo === 'ENTRADA') {
        acc.entradasPrevistas += valor
        if (lanc.status === 'PAGO') acc.entradasRealizadas += valor
      } else {
        acc.saidasPrevistas += valor
        if (lanc.status === 'PAGO') acc.saidasRealizadas += valor
      }
      return acc
    }, { entradasPrevistas: 0, entradasRealizadas: 0, saidasPrevistas: 0, saidasRealizadas: 0 })

    return res.json({
      periodo: mes && ano ? `${mes}/${ano}` : 'Geral',

      // Detalhe específico das mensalidades (importante para gestão escolar)
      mensalidades: {
        gerado: Number(resumoBoletos.valorGerado.toFixed(2)),
        recebido: Number(resumoBoletos.valorRecebido.toFixed(2)),
        vencido: Number(resumoBoletos.valorVencido.toFixed(2)),
        inadimplenciaCount: resumoBoletos.qtdVencidos,
        taxaRecebimento: resumoBoletos.total > 0 ? ((resumoBoletos.qtdPagos / resumoBoletos.total) * 100).toFixed(1) + '%' : '0%'
      },

      // [NOVO] Visão Macro do Negócio (DRE Simplificado)
      balancoGeral: {
        receitaTotal: Number((resumoBoletos.valorRecebido + fluxoCaixa.entradasRealizadas).toFixed(2)), // O que entrou no banco
        despesaTotal: Number(fluxoCaixa.saidasRealizadas.toFixed(2)), // O que saiu do banco
        lucroLiquido: Number(((resumoBoletos.valorRecebido + fluxoCaixa.entradasRealizadas) - fluxoCaixa.saidasRealizadas).toFixed(2)),

        previsaoFechamento: {
          receitaPotencial: Number((resumoBoletos.valorGerado + fluxoCaixa.entradasPrevistas).toFixed(2)),
          despesaPrevista: Number(fluxoCaixa.saidasPrevistas.toFixed(2)),
          saldoProjetado: Number(((resumoBoletos.valorGerado + fluxoCaixa.entradasPrevistas) - fluxoCaixa.saidasPrevistas).toFixed(2))
        }
      }
    })
  },

  // Relatório Pedagógico 
  async pedagogico(req: Request, res: Response) {
    const { turmaId, anoLetivo } = req.query
    const escolaId = req.user?.escolaId // [MELHORIA] Extrair variável

    let where: any = {}
    if (turmaId) where.turmaId = turmaId
    if (anoLetivo) where.anoLetivo = Number(anoLetivo)

    // [SEGURANÇA] Garantir que o where sempre tenha o filtro da escola no nível raiz
    where.aluno = { escolaId: escolaId, deletedAt: null } // [CORREÇÃO] Use a variável extraída

    const notas = await prisma.nota.findMany({
      where,
      include: {
        aluno: { select: { id: true, nome: true } },
        disciplina: { select: { nome: true } },
      },
    })

    const resumoPorDisciplina = notas.reduce((acc: any, nota) => {
      const key = nota.disciplinaId
      // ... (Lógica mantida idêntica, está boa)
      if (!acc[key]) {
        acc[key] = {
          disciplina: nota.disciplina.nome,
          totalNotas: 0,
          somaNotas: 0,
          menorNota: 10,
          maiorNota: 0,
          aprovados: 0,
          reprovados: 0,
        }
      }
      const valorNota = Number(nota.valor)
      acc[key].totalNotas++
      acc[key].somaNotas += valorNota
      if (valorNota < acc[key].menorNota) acc[key].menorNota = valorNota
      if (valorNota > acc[key].maiorNota) acc[key].maiorNota = valorNota

      // [OPCIONAL] Se quiser deixar parametrizável a média, pode virar uma config da Escola
      if (valorNota >= 6) acc[key].aprovados++
      else acc[key].reprovados++

      return acc
    }, {})

    const relatorio = Object.values(resumoPorDisciplina).map((item: any) => ({
      ...item,
      mediaGeral: Number((item.somaNotas / item.totalNotas).toFixed(2)),
      taxaAprovacao: Number(((item.aprovados / item.totalNotas) * 100).toFixed(2)),
    }))

    return res.json({
      anoLetivo: anoLetivo || 'Todos',
      turma: turmaId || 'Todas',
      totalNotas: notas.length,
      disciplinas: relatorio,
    })
  },

  // Relatório de Frequência
  async estruturaTurmas(req: Request, res: Response) {
    const turmas = await prisma.turma.findMany({
      where: withEscolaId({}),
      select: {
        id: true,
        nome: true,
        turno: true,
        anoLetivo: true,
        _count: {
          select: {
            alunos: true,
            professores: true,
            disciplinas: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    })

    const relatorio = turmas.map(t => ({
      turma: t.nome,
      turno: t.turno,
      qtdAlunos: t._count.alunos, // [ALTERADO] Nomes mais claros
      qtdProfessores: t._count.professores,
    }))

    return res.json({
      totalTurmas: turmas.length,
      detalhes: relatorio,
    })
  },

  // Exportar Alunos CSV
  // Exportar Alunos CSV
  async exportarAlunos(req: Request, res: Response) {
    // ... (Mantido igual, apenas verifique se CSV precisa de aspas em nomes compostos)
    const alunos = await prisma.aluno.findMany({
      where: withTenancy({}),
      // ... select mantido
      select: {
        nome: true,
        numeroMatricula: true,
        cpf: true,
        dataNascimento: true,
        turno: true,
        turma: { select: { nome: true, anoLetivo: true } },
        responsaveis: { select: { nome: true, tipo: true, telefone1: true, email: true } },
        contrato: { select: { valorMensalidade: true, ativo: true } },
      },
      orderBy: { nome: 'asc' },
    })

    const csv = [
      'Nome,Matricula,CPF,Turma,Turno,Responsavel,Telefone,Mensalidade', // Cabeçalho simplificado
      ...alunos.map(a => {
        const resp = a.responsaveis[0] || {}
        // [MELHORIA] Adicionei aspas ("") para evitar quebra do CSV se houver vírgula no nome
        return [
          `"${a.nome}"`,
          a.numeroMatricula,
          a.cpf || '',
          `"${a.turma?.nome || ''}"`,
          a.turno || '',
          `"${resp.nome || ''}"`,
          resp.telefone1 || '',
          a.contrato?.valorMensalidade || '0.00',
        ].join(',')
      }),
    ].join('\n')

    res.header('Content-Type', 'text/csv; charset=utf-8')
    res.header('Content-Disposition', 'attachment; filename=alunos.csv')
    return res.send(csv)
  },
}