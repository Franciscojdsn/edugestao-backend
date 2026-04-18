import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { withEscolaId, withTenancy } from '../utils/prismaHelpers'

export const dashboardController = {

  // Visão geral do dashboard
  async geral(req: Request, res: Response) {
    const escolaId = req.user?.escolaId
    const hoje = new Date()
    
    // Lógica de Ciclo Financeiro: Fechamento dia 10
    const diaCorte = 10;
    let inicioCiclo: Date;
    let fimCiclo: Date;

    if (hoje.getDate() <= diaCorte) {
      inicioCiclo = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 11);
      fimCiclo = new Date(hoje.getFullYear(), hoje.getMonth(), diaCorte, 23, 59, 59);
    } else {
      inicioCiclo = new Date(hoje.getFullYear(), hoje.getMonth(), 11);
      fimCiclo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, diaCorte, 23, 59, 59);
    }

    const inicioAno = new Date(hoje.getFullYear(), 0, 1);
    const fimAno = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59); // Até o fim do ano corrente

    const [
      totalAlunos,
      totalFuncionarios,
      totalTurmas,
      totalDisciplinas,
      alunosAtivos,
      funcionariosAtivos,
      entradaMensal,
      saidaMensal,
      estimadoMensal,
      estimadoAnual,
      pendenteMensal,
      pendenteAnual,
    ] = await Promise.all([
      prisma.aluno.count({ where: withEscolaId({}) }),
      prisma.funcionario.count({ where: withEscolaId({}) }),
      prisma.turma.count({ where: withEscolaId({}) }),
      prisma.disciplina.count({ where: withEscolaId({}) }),
      prisma.aluno.count({ where: withTenancy({}) }),
      prisma.funcionario.count({ where: withTenancy({}) }),

      // 1. Entrada Mensal Realizada (Transações de Entrada no Ciclo)
      prisma.transacao.aggregate({
        where: {
          escolaId,
          tipo: 'ENTRADA',
          data: { gte: inicioCiclo, lte: fimCiclo },
          deletedAt: { equals: null }
        },
        _sum: { valor: true }
      }),

      // 2. Saída Mensal Realizada (Lançamentos de Saída no Ciclo)
      prisma.lancamento.aggregate({
        where: {
          escolaId,
          tipo: 'SAIDA',
          dataVencimento: { gte: inicioCiclo, lte: fimCiclo },
          deletedAt: { equals: null }
        },
        _sum: { valor: true }
      }),

      // 3. Estimado Mensal (Todos os Boletos do Ciclo)
      prisma.boletos.aggregate({
        where: {
          aluno: { escolaId },
          dataVencimento: { gte: inicioCiclo, lte: fimCiclo },
          status: { not: 'CANCELADO' as any }, // Apenas boletos válidos (Pagos, Pendentes ou Vencidos)
          deletedAt: null
        },
        _sum: { valorTotal: true }
      }),

      // 4. Estimado Anual (Todos os Boletos do Ano)
      prisma.boletos.aggregate({
        where: {
          aluno: { escolaId },
          dataVencimento: { gte: inicioAno, lte: fimAno },
          status: { not: 'CANCELADO' as any },
          deletedAt: null
        },
        _sum: { valorTotal: true }
      }),

      // 5. Valores Pendentes Acumulados (Dívida total de qualquer período)
      prisma.boletos.aggregate({
        where: {
          aluno: { escolaId },
          status: { in: ['PENDENTE', 'VENCIDO'] as any },
          dataVencimento: { lte: fimCiclo }, // Removemos o 'gte' para pegar meses retroativos (ex: mês 04)
          deletedAt: null
        },
        _sum: { valorTotal: true }
      }),

      // 6. Pendente Anual (Boletos Pendentes/Vencidos do Ano)
      prisma.boletos.aggregate({
        where: {
          aluno: { escolaId },
          status: { in: ['PENDENTE', 'VENCIDO'] as any },
          dataVencimento: { gte: inicioAno, lte: fimAno },
          deletedAt: null
        },
        _sum: { valorTotal: true }
      }),
    ])

    const valEntrada = Number(entradaMensal._sum?.valor || 0)
    const valSaida = Number(saidaMensal._sum?.valor || 0)
    const valEstimadoMensal = Number(estimadoMensal._sum?.valorTotal || 0)
    const valEstimadoAnual = Number(estimadoAnual._sum?.valorTotal || 0)
    const valPendenteMensal = Number(pendenteMensal._sum?.valorTotal || 0)
    const valPendenteAnual = Number(pendenteAnual._sum?.valorTotal || 0)

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
        entradaMensal: valEntrada,
        saidaMensal: valSaida,
        estimadoMensal: valEstimadoMensal,
        estimadoAnual: valEstimadoAnual,
        pendenteMensal: valPendenteMensal,
        pendenteAnual: valPendenteAnual,
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