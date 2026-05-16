import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { withEscolaId, withTenancy } from '../utils/prismaHelpers'

export const relatorioController = {

  // Relatório Financeiro
  async financeiro(req: Request, res: Response) {
    const { mes, ano } = req.query
    const escolaId = req.user?.escolaId
    const hoje = new Date()
    // Normaliza para o início do dia para evitar que boletos vencendo hoje sejam considerados atrasados precocemente
    const hojeInicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    const mesAtual = Number(mes) || hoje.getMonth() + 1;
    const anoAtual = Number(ano) || hoje.getFullYear();
    const inicioMes = new Date(anoAtual, mesAtual - 1, 1);
    const fimMes = new Date(anoAtual, mesAtual, 0, 23, 59, 59);

    // Agregações otimizadas com Prisma
    const [entradasAvulsas, mensalidadesPagas, mensalidadesEsperadas, mensalidadesAno, inadimplentes, totalAlunos, totalInadimplentes, aniversariantesData, escola] = await Promise.all([
      // receitaRealizadaMes (Lançamentos Avulsos)
      prisma.lancamento.aggregate({
        _sum: { valor: true },
        where: { escolaId, tipo: 'ENTRADA', status: 'PAGO', dataLiquidacao: { gte: inicioMes, lte: fimMes } }
      }),
      // receitaRealizadaMes (Boletos/Mensalidades)
      prisma.boletos.aggregate({
        _sum: { valorPago: true },
        where: { escolaId, status: 'PAGO', dataPagamento: { gte: inicioMes, lte: fimMes }, aluno: { deletedAt: null, contrato: { ativo: true } } } 
      }),
      // esperadoMensal (Apenas Boletos PENDENTES de alunos ativos no mês selecionado que ainda NÃO venceram)
      prisma.boletos.aggregate({
        _sum: { valorTotal: true },
        where: { 
          escolaId, 
          dataVencimento: { 
            gte: hojeInicioDia > inicioMes ? hojeInicioDia : inicioMes, 
            lte: fimMes 
          }, 
          status: 'PENDENTE', 
          aluno: { deletedAt: null, contrato: { ativo: true } } 
        }
      }),
      // estimadoAnual (Todos os boletos não cancelados do ano para a base de alunos ativos)
      prisma.boletos.aggregate({
        _sum: { valorTotal: true },
        where: { escolaId, dataVencimento: { gte: new Date(anoAtual, 0, 1), lte: new Date(anoAtual, 11, 31) }, status: { notIn: ['CANCELADO', 'PAGO'] }, aluno: { deletedAt: null, contrato: { ativo: true } } }
      }),
      // pendentesAtrasados (Apenas boletos vencidos de alunos atualmente ativos)
      prisma.boletos.aggregate({
        _sum: { valorTotal: true },
        where: { 
          escolaId, 
          status: { in: ['PENDENTE', 'VENCIDO'] }, 
          dataVencimento: { lt: hojeInicioDia },
          aluno: { deletedAt: null, contrato: { ativo: true } }
        }
      }),
      // 6. Total de Alunos Ativos (Contagem para o Dashboard)
      prisma.aluno.count({
        where: { escolaId, contrato: { ativo: true } }
      }),
      // 7. Total de Alunos Inadimplentes (Contagem para o Dashboard)
      prisma.aluno.count({
        where: { 
          escolaId, 
          contrato: { ativo: true }, // Garante que apenas alunos com contrato ativo entrem na contagem
          boletos: { 
            some: { 
              status: { in: ['PENDENTE', 'VENCIDO'] }, 
              dataVencimento: { lt: hojeInicioDia } 
            } 
          } 
        }
      }),
      // 8. Busca datas para cálculo de aniversariantes do mês
      prisma.aluno.findMany({
        where: { 
          escolaId, 
          contrato: { ativo: true }, // Apenas alunos ativos devem ser considerados para o KPI de aniversariantes
          dataNascimento: { not: null } 
        },
        select: { dataNascimento: true }
      }),
      // 9. Informações da Escola
      prisma.escola.findFirst({
        where: { id: escolaId },
        select: { nome: true, cnpj: true }
      })
    ]);

    const totalAniversariantes = aniversariantesData.filter(a => 
      a.dataNascimento?.getUTCMonth() === hoje.getUTCMonth()
    ).length;

    const receitaRealizada = (Number(entradasAvulsas._sum.valor) || 0) + (Number(mensalidadesPagas._sum.valorPago) || 0);
    const valorInadimplenteTotal = Number(inadimplentes._sum.valorTotal) || 0;

    return res.json({
      status: 'success',
      data: {
        escola,
        kpis: {
          receitaRealizadaMes: receitaRealizada,
          esperadoMensal: Number(mensalidadesEsperadas._sum.valorTotal) || 0,
          estimadoAnual: Number(mensalidadesAno._sum.valorTotal) || 0,
          pendentesAtrasados: valorInadimplenteTotal,
          totalAlunos,
          totalInadimplentes,
          totalAniversariantes,
          valorInadimplente: valorInadimplenteTotal,
          faturamentoCiclo: receitaRealizada,
          dataCalculo: new Date().toISOString()
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
            turmaProfessors: true,
            turmaDisciplinas: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    })

    const relatorio = turmas.map(t => ({
      turma: t.nome,
      turno: t.turno,
      qtdAlunos: t._count.alunos, // [ALTERADO] Nomes mais claros
      qtdProfessores: t._count.turmaProfessors,
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
        turma: { select: { nome: true, anoLetivo: true, turno: true } },
        responsaveis: { select: { nome: true, tipo: true, telefone1: true, email: true } },
        contrato: { select: { valorMensalidadeBase: true, ativo: true } },
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
          a.turma?.turno || '',
          `"${resp.nome || ''}"`,
          resp.telefone1 || '',
          a.contrato?.valorMensalidadeBase || '0.00',
        ].join(',')
      }),
    ].join('\n')

    res.header('Content-Type', 'text/csv; charset=utf-8')
    res.header('Content-Disposition', 'attachment; filename=alunos.csv')
    return res.send(csv)
  },
}