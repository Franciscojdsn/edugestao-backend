import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { withEscolaId, withTenancy } from '../utils/prismaHelpers'

export const dashboardController = {

  // Visão geral do dashboard
  async geral(req: Request, res: Response) {
    const escolaId = req.user?.escolaId
    const hoje = new Date()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59)

    const [
      totalAlunos,
      totalFuncionarios,
      totalTurmas,
      totalDisciplinas,
      alunosAtivos,
      funcionariosAtivos,
      faturamentoRealizado,
      pendenciaBoletos,
      receitaAvulsaPendente,
      despesasMes,
    ] = await Promise.all([
      prisma.aluno.count({ where: withEscolaId({}) }),
      prisma.funcionario.count({ where: withEscolaId({}) }),
      prisma.turma.count({ where: withEscolaId({}) }),
      prisma.disciplina.count({ where: withEscolaId({}) }),
      prisma.aluno.count({ where: withTenancy({}) }),
      prisma.funcionario.count({ where: withTenancy({}) }),

      // 1. O que JÁ entrou no caixa (Dinheiro na mão)
      prisma.transacao.aggregate({
        where: {
          escolaId,
          tipo: 'ENTRADA',
          data: { gte: inicioMes, lte: fimMes },
          deletedAt: { equals: null }
        },
        _sum: { valor: true }
      }),

      // 2. O que DEVERIA ter entrado via Boletos (Inadimplência ou A Vencer)
      prisma.boletos.aggregate({
        where: {
          aluno: { escolaId },
          status: { in: ['PENDENTE', 'VENCIDO'] }, // [CORREÇÃO] Filtro correto
          dataVencimento: { gte: inicioMes, lte: fimMes }, // [ALTERADO] Considera o mês todo
          deletedAt: { equals: null }
        },
        _sum: { valorTotal: true } // [NOTA] Boletos usa valorTotal
      }),

      // 3. Receitas Avulsas Pendentes (Tabela Lancamento) [NOVO]
      prisma.lancamento.aggregate({
        where: {
          escolaId,
          tipo: 'ENTRADA',
          status: 'PENDENTE',
          dataVencimento: { gte: inicioMes, lte: fimMes },
          deletedAt: { equals: null }
        },
        _sum: { valor: true }
      }),

      // 4. Despesas do Mês (Tabela Lancamento) [NOVO]
      prisma.lancamento.aggregate({
        where: {
          escolaId,
          tipo: 'SAIDA',
          dataVencimento: { gte: inicioMes, lte: fimMes },
          deletedAt: { equals: null }
        },
        _sum: { valor: true }
      }),
    ])

    const valFaturamento = Number(faturamentoRealizado._sum?.valor || 0)
    const valPendenciaBoletos = Number(pendenciaBoletos._sum?.valorTotal || 0)
    const valReceitaAvulsa = Number(receitaAvulsaPendente._sum?.valor || 0)
    const valDespesas = Number(despesasMes._sum?.valor || 0)

    // Saldo Projetado = (O que tenho + O que vou receber) - (O que tenho que pagar)
    const saldoProjetado = (valFaturamento + valPendenciaBoletos + valReceitaAvulsa) - valDespesas

    const alunosPorTurno = await prisma.aluno.groupBy({
      by: ['turno'],
      where: withTenancy({}),
      _count: true,
    })

    const funcionariosPorCargo = await prisma.funcionario.groupBy({
      by: ['cargo'],
      where: withTenancy({}),
      _count: true,
    })

    return res.json({
      resumo: {
        totalAlunos,
        totalFuncionarios,
        totalTurmas,
        totalDisciplinas,
        alunosAtivos,
        funcionariosAtivos,
        alunosDeletados: totalAlunos - alunosAtivos,
        funcionariosDeletados: totalFuncionarios - funcionariosAtivos,
      },
      // [NOVO] Objeto dedicado ao financeiro para facilitar o frontend
      financeiro: {
        faturamentoRealizado: valFaturamento,
        aReceber: valPendenciaBoletos + valReceitaAvulsa, // Soma boletos e avulsos
        despesasTotal: valDespesas,
        saldoProjetado: saldoProjetado,
        inadimplenciaBoletos: valPendenciaBoletos // Mantido para retrocompatibilidade se precisar
      },
      alunosPorTurno: alunosPorTurno.map(t => ({
        turno: t.turno,
        quantidade: t._count,
      })),
      funcionariosPorCargo: funcionariosPorCargo.map(f => ({
        cargo: f.cargo,
        quantidade: f._count,
      })),
    })
  },

  // Listagem de turmas com alunos inscritos
  async turmas(req: Request, res: Response) {
    const turmas = await prisma.turma.findMany({
      where: withEscolaId({}),
      select: {
        id: true,
        nome: true,
        anoLetivo: true,
        turno: true,
        capacidadeMaxima: true,
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

    const turmasComOcupacao = turmas.map(t => ({
      ...t,
      ocupacao: t.capacidadeMaxima
        ? Number(((t._count.alunos / t.capacidadeMaxima) * 100).toFixed(2))
        : 0,
      vagas: t.capacidadeMaxima ? t.capacidadeMaxima - t._count.alunos : null,
    }))

    return res.json({
      turmas: turmasComOcupacao,
      total: turmas.length,
    })
  },

  // Dashboard focado em performance de alunos e turmas
  async pedagogico(req: Request, res: Response) {
    const escolaId = req.user?.escolaId
    const { anoLetivo = new Date().getFullYear() } = req.query

    const [
      mediaGlobal,
      mediasPorTurma,
      totalFrequencias,
      totalFaltas,
      totalOcorrencias,
      ocorrenciasGraves
    ] = await Promise.all([
      // 1. Média de notas de toda a escola (Novo)
      prisma.nota.aggregate({
        where: { aluno: { escolaId, deletedAt: { equals: null } }, anoLetivo: Number(anoLetivo) },
        _avg: { valor: true }
      }),

      // 2. Média de notas agrupada por Turma (Novo)
      prisma.nota.groupBy({
        by: ['turmaId'],
        where: { aluno: { escolaId, deletedAt: { equals: null } }, anoLetivo: Number(anoLetivo) },
        _avg: { valor: true },
      }),

      // 3. Dados para Taxa de Faltas (Novo)
      prisma.frequencia.count({ where: { escolaId } }),
      prisma.frequencia.count({ where: { escolaId, presente: false } }),

      // 4. Dados para Ocorrências (Novo)
      prisma.ocorrencia.count({ where: { escolaId } }),
      prisma.ocorrencia.count({ where: { escolaId, gravidade: 'GRAVE' } }),

      // 5. Buscar nomes das turmas para o gráfico (Novo)
      prisma.turma.findMany({
        where: { escolaId, deletedAt: { equals: null } },
        select: { id: true, nome: true }
      })
    ])

    // Como o Promise.all retorna um array, vamos mapear as médias com os nomes:
    const turmas = await prisma.turma.findMany({ where: { escolaId }, select: { id: true, nome: true } });

    const desempenhoTurmas = mediasPorTurma.map(m => {
      const turma = turmas.find(t => t.id === m.turmaId);
      return {
        turma: turma?.nome || 'N/A',
        media: Number(m._avg.valor?.toFixed(2) || 0)
      };
    });

    // Cálculos de taxas (Novo)
    const taxaFaltas = totalFrequencias > 0
      ? Number(((totalFaltas / totalFrequencias) * 100).toFixed(2))
      : 0;

    const taxaOcorrenciasGraves = totalOcorrencias > 0
      ? Number(((ocorrenciasGraves / totalOcorrencias) * 100).toFixed(2))
      : 0;

    return res.json({
      resumo: {
        mediaEscolarGlobal: Number(mediaGlobal._avg.valor?.toFixed(2) || 0),
        taxaFaltas,
        taxaOcorrenciasGraves,
        totalOcorrencias
      },
      graficoMediasPorTurma: desempenhoTurmas,
      statusOcorrencias: {
        total: totalOcorrencias,
        graves: ocorrenciasGraves,
        outras: totalOcorrencias - ocorrenciasGraves
      }
    });
  },

  // Listagem de aniversariantes do mês
  async aniversariantes(req: Request, res: Response) {
    const { mes } = req.query
    const mesAtual = mes ? Number(mes) : new Date().getMonth() + 1

    // Buscar alunos
    const alunos = await prisma.aluno.findMany({
      where: withTenancy({}),
      select: {
        id: true,
        nome: true,
        dataNascimento: true,
        numeroMatricula: true,
        turma: { select: { nome: true } },
      },
    })

    const aniversariantes = alunos
      .filter(a => {
        if (!a.dataNascimento) return false
        return new Date(a.dataNascimento).getMonth() + 1 === mesAtual
      })
      .map(a => ({
        ...a,
        dia: new Date(a.dataNascimento!).getDate(),
      }))
      .sort((a, b) => a.dia - b.dia)

    return res.json({
      mes: mesAtual,
      total: aniversariantes.length,
      aniversariantes,
    })
  },
}