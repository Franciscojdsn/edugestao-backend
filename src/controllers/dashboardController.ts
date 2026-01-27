import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { withEscolaId, withTenancy } from '../utils/prismaHelpers'

export const dashboardController = {
  async geral(req: Request, res: Response) {
    const escolaId = req.user?.escolaId

    const [
      totalAlunos,
      totalFuncionarios,
      totalTurmas,
      totalDisciplinas,
      alunosAtivos,
      funcionariosAtivos,
    ] = await Promise.all([
      prisma.aluno.count({ where: withEscolaId({}) }),
      prisma.funcionario.count({ where: withEscolaId({}) }),
      prisma.turma.count({ where: withEscolaId({}) }),
      prisma.disciplina.count({ where: withEscolaId({}) }),
      prisma.aluno.count({ where: withTenancy({}) }),
      prisma.funcionario.count({ where: withTenancy({}) }),
    ])

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