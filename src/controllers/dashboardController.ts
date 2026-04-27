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
      totalAlunos,
      totalTurmas,
      inadimplencia,
      faturamentoCiclo
    ] = await Promise.all([
      // 1. Total de alunos ativos (que possuem contrato ativo)
      prisma.aluno.count({
        where: { contrato: { ativo: true } }
      }),

      // 2. Turmas cadastradas
      prisma.turma.count(),

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
      })
    ]);

    return res.json({
      status: 'success',
      data: {
        cicloAtual: { inicio: inicioCiclo, fim: fimCiclo },
        kpis: {
          totalAlunos,
          totalTurmas,
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