import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const dashboardController = {

  /**
   * GET /dashboard/geral
   * Retorna os KPIs principais (Agregações delegadas ao banco Neon)
   */
  async geral(req: Request, res: Response) {
    const hoje = new Date();

    // Lógica de Ciclo Financeiro (Fechamento dia 10)
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

    // Execução Paralela de Agregações (Performance Máxima)
    // A Extensão Prisma aplicará 'escolaId' e 'deletedAt: null' silenciosamente em TODAS elas
    const [
      escola,
      totalAlunos,
      totalInadimplentes,
      inadimplencia,
      faturamentoCiclo,
      todosAlunosData // Para contar aniversariantes em memória (mais seguro p/ diferentes DBs)
    ] = await Promise.all([
      // 0. Informações da Escola (Nome e CNPJ)
      prisma.escola.findFirst({
        select: { nome: true, cnpj: true }
      }),

      // 1. Total de alunos ativos (que possuem contrato ativo)
      prisma.aluno.count({
        where: { contrato: { ativo: true } }
      }),

      // 2. Total de alunos inadimplentes (com boletos vencidos)
      prisma.aluno.count({
        where: { boletos: { some: { status: 'VENCIDO', dataVencimento: { lt: hoje } } } }
      }),

      // 3. Inadimplência (Boletos vencidos e não pagos)
      prisma.boletos.aggregate({
        _sum: { valorTotal: true },
        where: {
          status: 'VENCIDO',
          dataVencimento: { lt: hoje }
        }
      }),

      // 4. Receita do Ciclo (Transações de Entrada no período)
      prisma.transacao.aggregate({
        _sum: { valor: true },
        where: {
          tipo: 'ENTRADA',
          data: { gte: inicioCiclo, lte: fimCiclo }
        }
      }),

      // 5. Busca datas de nascimento para filtro de aniversariantes
      prisma.aluno.findMany({
        where: { dataNascimento: { not: null } },
        select: { dataNascimento: true }
      })
    ]);

    const totalAniversariantes = todosAlunosData.filter(a => 
      a.dataNascimento?.getMonth() === hoje.getMonth()
    ).length;

    return res.json({
      status: 'success',
      data: {
        escola,
        cicloAtual: { inicio: inicioCiclo, fim: fimCiclo },
        kpis: {
          totalAlunos,
          totalInadimplentes,
          totalAniversariantes,
          valorInadimplente: inadimplencia._sum.valorTotal || 0,
          faturamentoCiclo: faturamentoCiclo._sum.valor || 0
        }
      }
    });
  },

  /**
   * GET /dashboard/aniversariantes
   * Retorna os alunos que fazem aniversário no mês selecionado
   */
  async aniversariantes(req: Request, res: Response) {
    const { mes } = req.query;
    const mesAtual = mes ? Number(mes) : new Date().getMonth() + 1;

    // A extensão Prisma garante o isolamento.
    const alunos = await prisma.aluno.findMany({
      where: {
        dataNascimento: { not: null }
      },
      select: {
        id: true,
        nome: true,
        dataNascimento: true,
        numeroMatricula: true,
        turma: { select: { nome: true } },
      },
      orderBy: { dataNascimento: 'asc' }
    });

    // Filtro em memória (pois o Prisma não tem extração de Mês nativa em TODAS as databases sem RAW Query)
    const aniversariantes = alunos.filter(a =>
      a.dataNascimento?.getMonth()! + 1 === mesAtual
    );

    return res.json({
      status: 'success',
      data: aniversariantes,
      total: aniversariantes.length
    });
  }
};