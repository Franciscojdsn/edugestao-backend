import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withTenancy } from '../utils/prismaHelpers'

export const historicoEscolarController = {
  /**
   * GET /historico-escolar/alunos/:alunoId
   * Gera histórico escolar completo do aluno
   */
  async gerar(req: Request, res: Response) {
    const { alunoId } = req.params
    const idFormatado = Array.isArray(alunoId) ? alunoId[0] : alunoId
    const { 
      anoInicio, 
      anoFim, 
      incluirFrequencia = true, 
      incluirFinanceiro = false 
    } = req.query

    // Buscar dados do aluno
    const aluno = await prisma.aluno.findFirst({
      where: withTenancy({ id: idFormatado }),
      include: {
        turma: {
          select: {
            nome: true,
            anoLetivo: true,
            turno: true,
          },
        },
        endereco: true,
        responsaveis: {
          select: {
            nome: true,
            tipo: true,
            telefone1: true,
            email: true,
            isResponsavelFinanceiro: true,
          },
        },
        escola: {
          select: {
            nome: true,
            cnpj: true,
            telefone: true,
            email: true,
          },
        },
      },
    })

    if (!aluno) throw new AppError('Aluno não encontrado', 404)

    // Construir filtro de anos
    let whereNotas: any = { alunoId: idFormatado }
    if (anoInicio || anoFim) {
      whereNotas.anoLetivo = {}
      if (anoInicio) whereNotas.anoLetivo.gte = Number(anoInicio)
      if (anoFim) whereNotas.anoLetivo.lte = Number(anoFim)
    }

    // Buscar notas
    const notas = await prisma.nota.findMany({
      where: whereNotas,
      include: {
        disciplina: { select: { nome: true, cargaHoraria: true } },
        turma: { select: { nome: true, anoLetivo: true } },
      },
      orderBy: [
        { anoLetivo: 'asc' },
        { bimestre: 'asc' },
      ],
    })

    // Agrupar notas por ano e disciplina
    const notasPorAno: any = {}
    notas.forEach(nota => {
      const ano = nota.anoLetivo
      if (!notasPorAno[ano]) notasPorAno[ano] = {}
      
      const disciplinaId = nota.disciplinaId
      if (!notasPorAno[ano][disciplinaId]) {
        notasPorAno[ano][disciplinaId] = {
          disciplina: nota.disciplina.nome,
          cargaHoraria: nota.disciplina.cargaHoraria,
          notas: [],
        }
      }
      
      notasPorAno[ano][disciplinaId].notas.push({
        bimestre: nota.bimestre,
        valor: Number(nota.valor),
      })
    })

    // Calcular médias
    const historicoAcademico = Object.keys(notasPorAno).map(ano => {
      const disciplinas = Object.values(notasPorAno[ano]).map((disc: any) => {
        const soma = disc.notas.reduce((s: number, n: any) => s + n.valor, 0)
        const media = disc.notas.length > 0 ? soma / disc.notas.length : 0
        
        return {
          disciplina: disc.disciplina,
          cargaHoraria: disc.cargaHoraria,
          notas: disc.notas,
          mediaFinal: Number(media.toFixed(2)),
          situacao: media >= 6 ? 'APROVADO' : media >= 4 ? 'RECUPERACAO' : 'REPROVADO',
        }
      })

      const mediaGeral = disciplinas.length > 0
        ? disciplinas.reduce((s, d) => s + d.mediaFinal, 0) / disciplinas.length
        : 0

      return {
        ano: Number(ano),
        disciplinas,
        mediaGeral: Number(mediaGeral.toFixed(2)),
      }
    })

    // Dados de frequência (se solicitado)
    let dadosFrequencia = null
    if (incluirFrequencia) {
      let whereFreq: any = { alunoId: idFormatado }
      if (anoInicio || anoFim) {
        whereFreq.data = {}
        if (anoInicio) whereFreq.data.gte = new Date(Number(anoInicio), 0, 1)
        if (anoFim) whereFreq.data.lte = new Date(Number(anoFim), 11, 31)
      }

      const frequencias = await prisma.frequencia.findMany({
        where: whereFreq,
      })

      const totalDias = frequencias.length
      const presencas = frequencias.filter(f => f.presente).length
      const faltas = totalDias - presencas

      dadosFrequencia = {
        totalDias,
        presencas,
        faltas,
        percentualPresenca: totalDias > 0 ? Number(((presencas / totalDias) * 100).toFixed(2)) : 0,
      }
    }

    // Dados financeiros (se solicitado)
    let dadosFinanceiros = null
    if (incluirFinanceiro) {
      const contrato = await prisma.contrato.findFirst({
        where: { alunoId: idFormatado },
        select: {
          valorMensalidade: true,
          diaVencimento: true,
          ativo: true,
          dataInicio: true,
          dataFim: true,
        },
      })

      const pagamentos = await prisma.pagamento.findMany({
        where: { alunoId: idFormatado },
        select: {
          referencia: true,
          valorTotal: true,
          status: true,
          dataVencimento: true,
          dataPagamento: true,
        },
        orderBy: { dataVencimento: 'asc' },
      })

      const totalPago = pagamentos
        .filter(p => p.status === 'PAGO')
        .reduce((s, p) => s + Number(p.valorTotal), 0)

      const totalPendente = pagamentos
        .filter(p => p.status === 'PENDENTE' || p.status === 'VENCIDO')
        .reduce((s, p) => s + Number(p.valorTotal), 0)

      dadosFinanceiros = {
        contrato,
        pagamentos: pagamentos.length,
        totalPago: Number(totalPago.toFixed(2)),
        totalPendente: Number(totalPendente.toFixed(2)),
        situacao: totalPendente > 0 ? 'PENDENTE' : 'REGULAR',
      }
    }

    // Atividades extra
    const atividadesExtra = await prisma.alunoAtividadeExtra.findMany({
      where: { 
        alunoId: idFormatado,
        ativo: true,
      },
      include: {
        atividadeExtra: {
          select: {
            nome: true,
            valor: true,
            diaAula: true,
            horario: true,
          },
        },
      },
    })

    return res.json({
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        cpf: aluno.cpf,
        dataNascimento: aluno.dataNascimento,
        numeroMatricula: aluno.numeroMatricula,
        dataMatricula: aluno.dataMatricula,
        turma: aluno.turma,
        endereco: aluno.endereco,
      },
      escola: aluno.escola,
      responsaveis: aluno.responsaveis,
      historicoAcademico,
      frequencia: dadosFrequencia,
      financeiro: dadosFinanceiros,
      atividadesExtra: atividadesExtra.map(a => a.atividadeExtra),
      geradoEm: new Date(),
    })
  },

  /**
   * GET /historico-escolar/alunos/:alunoId/resumo
   * Resumo rápido do histórico
   */
  async resumo(req: Request, res: Response) {
    const { alunoId } = req.params
    const idFormatado = Array.isArray(alunoId) ? alunoId[0] : alunoId

    const aluno = await prisma.aluno.findFirst({
      where: withTenancy({ id: idFormatado }),
      select: {
        nome: true,
        numeroMatricula: true,
        turma: { select: { nome: true, anoLetivo: true } },
      },
    })

    if (!aluno) throw new AppError('Aluno não encontrado', 404)

    const [totalNotas, mediaGeral, totalFrequencias, totalComunicados] = await Promise.all([
      prisma.nota.count({ where: { alunoId: idFormatado } }),
      prisma.nota.aggregate({
        where: { alunoId: idFormatado },
        _avg: { valor: true },
      }),
      prisma.frequencia.count({ where: { alunoId: idFormatado } }),
      prisma.comunicado.count({ where: { alunoId: idFormatado } }),
    ])

    const presencas = await prisma.frequencia.count({
      where: { alunoId: idFormatado, presente: true },
    })

    return res.json({
      aluno,
      resumo: {
        totalNotas,
        mediaGeral: mediaGeral._avg.valor ? Number(Number(mediaGeral._avg.valor).toFixed(2)) : 0,
        totalDiasLetivos: totalFrequencias,
        presencas,
        faltas: totalFrequencias - presencas,
        percentualPresenca: totalFrequencias > 0 
          ? Number(((presencas / totalFrequencias) * 100).toFixed(2)) 
          : 0,
        comunicadosRecebidos: totalComunicados,
      },
    })
  },

  /**
   * GET /historico-escolar/alunos/:alunoId/boletim-completo
   * Boletim de todos os anos
   */
  async boletimCompleto(req: Request, res: Response) {
    const { alunoId } = req.params
    const idFormatado = Array.isArray(alunoId) ? alunoId[0] : alunoId

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

    const notas = await prisma.nota.findMany({
      where: { alunoId: idFormatado },
      include: {
        disciplina: { select: { nome: true } },
      },
      orderBy: [
        { anoLetivo: 'asc' },
        { disciplina: { nome: 'asc' } },
        { bimestre: 'asc' },
      ],
    })

    // Agrupar por ano e disciplina
    const boletimPorAno: any = {}
    notas.forEach(nota => {
      const ano = nota.anoLetivo
      if (!boletimPorAno[ano]) boletimPorAno[ano] = {}
      
      const disciplina = nota.disciplina.nome
      if (!boletimPorAno[ano][disciplina]) {
        boletimPorAno[ano][disciplina] = {
          1: null,
          2: null,
          3: null,
          4: null,
        }
      }
      
      boletimPorAno[ano][disciplina][nota.bimestre] = Number(nota.valor)
    })

    // Formatar para resposta
    const boletim = Object.keys(boletimPorAno).map(ano => ({
      ano: Number(ano),
      disciplinas: Object.keys(boletimPorAno[ano]).map(disciplina => {
        const notas = boletimPorAno[ano][disciplina]
        const valores = Object.values(notas).filter((v): v is number => v !== null)
        const media = valores.length > 0 
          ? valores.reduce((s: number, v: number) => s + v, 0) / valores.length 
          : 0

        return {
          disciplina,
          bimestre1: notas[1],
          bimestre2: notas[2],
          bimestre3: notas[3],
          bimestre4: notas[4],
          media: Number(media.toFixed(2)),
          situacao: media >= 6 ? 'APROVADO' : media >= 4 ? 'RECUPERACAO' : 'REPROVADO',
        }
      }),
    }))

    return res.json({
      aluno,
      boletim,
    })
  },
}