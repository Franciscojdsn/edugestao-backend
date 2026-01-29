import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withEscolaId, withTenancy } from '../utils/prismaHelpers'

export const frequenciaController = {
  /**
   * POST /frequencias/chamada
   * Registra presença/falta de múltiplos alunos de uma vez
   */
  async registrarChamada(req: Request, res: Response) {
    const { turmaId, disciplinaId, data, presencas } = req.body;

    // 1. Verificar turma
    const turma = await prisma.turma.findFirst({
      where: withEscolaId({ id: turmaId }),
    });
    if (!turma) throw new AppError('Turma não encontrada', 404);

    // 2. Verificar disciplina (se informada)
    if (disciplinaId) {
      const disciplina = await prisma.disciplina.findFirst({
        where: withEscolaId({ id: disciplinaId }),
      });
      if (!disciplina) throw new AppError('Disciplina não encontrada', 404);
    }

    // 3. Normalizar Data (Zerar horas para evitar erros no @@unique)
    const dataFormatada = new Date(data);
    dataFormatada.setUTCHours(0, 0, 0, 0);

    const frequenciasProcessadas = [];

    for (const presenca of presencas) {
      // 4. Verificar se aluno pertence à turma
      const aluno = await prisma.aluno.findFirst({
        where: withTenancy({
          id: presenca.alunoId,
          turmaId,
        }),
      });

      if (!aluno) continue;

      // 5. APLICAR UPSERT
      // 1. Buscar se já existe registro (findFirst aceita disciplinaId como null ou string)
      const existente = await prisma.frequencia.findFirst({
        where: {
          alunoId: presenca.alunoId,
          turmaId,
          data: dataFormatada,
          disciplinaId: disciplinaId ?? null, // Aqui o null funciona perfeitamente
        },
      });

      let registro;

      if (existente) {
        // 2. Se existe, atualizamos pelo ID primário
        registro = await prisma.frequencia.update({
          where: { id: existente.id },
          data: {
            presente: presenca.presente,
            justificativa: presenca.justificativa,
          },
        });
      } else {
        // 3. Se não existe, criamos um novo
        registro = await prisma.frequencia.create({
          data: {
            alunoId: presenca.alunoId,
            turmaId,
            disciplinaId: disciplinaId ?? null,
            data: dataFormatada,
            presente: presenca.presente,
            justificativa: presenca.justificativa,
          },
        });
      }

      frequenciasProcessadas.push(registro);
    }

    return res.status(201).json({
      message: `Chamada processada: ${frequenciasProcessadas.length} aluno(s)`,
      data: dataFormatada,
      turma: { id: turma.id, nome: turma.nome },
      frequencias: frequenciasProcessadas,
    });
  },

  /**
   * GET /frequencias
   * Lista registros de frequência com filtros
   */
  async list(req: Request, res: Response) {
    const { page = 1, limit = 50, turmaId, alunoId, dataInicio, dataFim } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const turmaIdFormatado = Array.isArray(turmaId) ? turmaId[0] : turmaId
    const alunoIdFormatado = Array.isArray(alunoId) ? alunoId[0] : alunoId


    let where: any = {}

    if (turmaIdFormatado) where.turmaId = turmaIdFormatado
    if (alunoIdFormatado) where.alunoId = alunoIdFormatado

    if (dataInicio || dataFim) {
      where.data = {}
      if (dataInicio) where.data.gte = new Date(dataInicio as string)
      if (dataFim) where.data.lte = new Date(dataFim as string)
    }

    where.turma = { escolaId: req.user?.escolaId }

    const [frequencias, total] = await Promise.all([
      prisma.frequencia.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          aluno: { select: { nome: true, numeroMatricula: true } },
          turma: { select: { nome: true } },
          disciplina: { select: { nome: true } },
        },
        orderBy: { data: 'desc' },
      }),
      prisma.frequencia.count({ where }),
    ])

    return res.json({
      data: frequencias,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    })
  },

  /**
   * GET /frequencias/alunos/:alunoId/relatorio
   * Relatório de frequência de um aluno
   */
  async relatorioAluno(req: Request, res: Response) {
    const { alunoId } = req.params
    const idFormatado = Array.isArray(alunoId) ? alunoId[0] : alunoId
    const { mesInicio, mesFim } = req.query

    const aluno = await prisma.aluno.findFirst({
      where: withTenancy({ id: idFormatado }),
      select: {
        id: true,
        nome: true,
        numeroMatricula: true,
        turma: { select: { nome: true } },
      },
    })

    if (!aluno) throw new AppError('Aluno não encontrado', 404)

    let where: any = { alunoId: idFormatado }

    if (mesInicio || mesFim) {
      where.data = {}
      if (mesInicio) {
        const [ano, mes] = (mesInicio as string).split('-')
        where.data.gte = new Date(Number(ano), Number(mes) - 1, 1)
      }
      if (mesFim) {
        const [ano, mes] = (mesFim as string).split('-')
        where.data.lte = new Date(Number(ano), Number(mes), 0, 23, 59, 59)
      }
    }

    const frequencias = await prisma.frequencia.findMany({
      where,
      include: {
        disciplina: { select: { nome: true } },
      },
      orderBy: { data: 'asc' },
    })

    const totalDias = frequencias.length
    const presencas = frequencias.filter(f => f.presente).length
    const faltas = totalDias - presencas
    const percentualPresenca = totalDias > 0 ? (presencas / totalDias) * 100 : 0

    return res.json({
      aluno,
      periodo: {
        inicio: mesInicio || 'Início',
        fim: mesFim || 'Fim',
      },
      resumo: {
        totalDias,
        presencas,
        faltas,
        percentualPresenca: Number(percentualPresenca.toFixed(2)),
      },
      detalhes: frequencias,
    })
  },

  /**
   * GET /frequencias/turmas/:turmaId/resumo
   * Resumo de frequência de toda turma
   */
  async resumoTurma(req: Request, res: Response) {
    const { turmaId } = req.params
    const idFormatado = Array.isArray(turmaId) ? turmaId[0] : turmaId
    const { data } = req.query

    const turma = await prisma.turma.findFirst({
      where: withEscolaId({ id: idFormatado }),
      include: {
        alunos: {
          where: { deletedAt: null },
          select: {
            id: true,
            nome: true,
            numeroMatricula: true,
          },
        },
      },
    })

    if (!turma) throw new AppError('Turma não encontrada', 404)

    let where: any = { turmaId: idFormatado }
    if (data) where.data = new Date(data as string)

    const frequencias = await prisma.frequencia.findMany({
      where,
      include: {
        aluno: { select: { nome: true, numeroMatricula: true } },
      },
    })

    // Agrupar por aluno
    const resumoPorAluno = turma.alunos.map(aluno => {
      const freqAluno = frequencias.filter(f => f.alunoId === aluno.id)
      const presencas = freqAluno.filter(f => f.presente).length
      const faltas = freqAluno.length - presencas

      return {
        aluno,
        presencas,
        faltas,
        total: freqAluno.length,
        percentual: freqAluno.length > 0 ? Number(((presencas / freqAluno.length) * 100).toFixed(2)) : 0,
      }
    })

    return res.json({
      turma: { id: turma.id, nome: turma.nome },
      data: data || 'Todas',
      totalAlunos: turma.alunos.length,
      resumo: resumoPorAluno,
    })
  },
}