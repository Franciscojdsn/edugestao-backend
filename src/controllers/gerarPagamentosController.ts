import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'

export const gerarPagamentosController = {
  /**
   * POST /contratos/:contratoId/gerar-pagamentos
   * Gera mensalidades automáticas para um contrato
   */
  async gerarPagamentosContrato(req: Request, res: Response) {
    const { contratoId } = req.params
    const idFormatado = Array.isArray(contratoId) ? contratoId[0] : contratoId
    const { meses = 12, mesInicio = 1, anoInicio = 2026 } = req.body

    // Verificar se contrato existe
    const contrato = await prisma.contrato.findFirst({
      where: {
        id: idFormatado,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
        ativo: true,
      },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            numeroMatricula: true,
          },
        },
      },
    })

    if (!contrato) throw new AppError('Contrato não encontrado ou inativo', 404)

    // Verificar se já existem pagamentos
    const pagamentosExistentes = await prisma.pagamento.findMany({
      where: {
        alunoId: contrato.alunoId,
        anoReferencia: anoInicio,
      },
      select: { mesReferencia: true, referencia: true },
    })

    const mesesExistentes = pagamentosExistentes.map(p => p.mesReferencia)

    // Gerar array de pagamentos
    const pagamentosParaCriar = []
    let mesAtual = mesInicio
    let anoAtual = anoInicio

    for (let i = 0; i < meses; i++) {
      // Pular se já existe
      if (mesesExistentes.includes(mesAtual)) {
        mesAtual++
        if (mesAtual > 12) {
          mesAtual = 1
          anoAtual++
        }
        continue
      }

      const mesNome = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ][mesAtual - 1]

      const referencia = `${mesAtual.toString().padStart(2, '0')}/${anoAtual}`

      // Data de vencimento: dia do contrato no mês atual
      const dataVencimento = new Date(anoAtual, mesAtual - 1, contrato.diaVencimento)

      pagamentosParaCriar.push({
        alunoId: contrato.alunoId,
        referencia,
        mesReferencia: mesAtual,
        anoReferencia: anoAtual,
        valorBase: contrato.valorMensalidade,
        valorAtividades: 0, // Pode ser calculado depois
        valorTotal: contrato.valorMensalidade,
        dataVencimento,
        status: 'PENDENTE',
      })

      mesAtual++
      if (mesAtual > 12) {
        mesAtual = 1
        anoAtual++
      }
    }

    // Criar pagamentos em batch
    const pagamentosCriados = await prisma.pagamento.createMany({
      data: pagamentosParaCriar,
      skipDuplicates: true,
    })

    return res.status(201).json({
      message: `${pagamentosCriados.count} pagamento(s) gerado(s) com sucesso`,
      contrato: {
        id: contrato.id,
        aluno: contrato.aluno,
        valorMensalidade: contrato.valorMensalidade,
      },
      pagamentosGerados: pagamentosCriados.count,
      pagamentosJaExistentes: mesesExistentes.length,
    })
  },

  /**
   * GET /contratos/:contratoId/pagamentos-pendentes
   * Lista pagamentos ainda não gerados para um contrato
   */
  async listarPagamentosPendentes(req: Request, res: Response) {
    const { contratoId } = req.params
    const idFormatado = Array.isArray(contratoId) ? contratoId[0] : contratoId
    const { ano = 2026 } = req.query

    const contrato = await prisma.contrato.findFirst({
      where: {
        id: idFormatado,
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
    })

    if (!contrato) throw new AppError('Contrato não encontrado', 404)

    // Buscar pagamentos já gerados
    const pagamentosGerados = await prisma.pagamento.findMany({
      where: {
        alunoId: contrato.alunoId,
        anoReferencia: Number(ano),
      },
      select: {
        mesReferencia: true,
        referencia: true,
        status: true,
        valorTotal: true,
      },
      orderBy: { mesReferencia: 'asc' },
    })

    const mesesGerados = pagamentosGerados.map(p => p.mesReferencia)
    const mesesFaltantes = []

    for (let mes = 1; mes <= 12; mes++) {
      if (!mesesGerados.includes(mes)) {
        const mesNome = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ][mes - 1]

        mesesFaltantes.push({
          mes,
          mesNome,
          referencia: `${mes.toString().padStart(2, '0')}/${ano}`,
        })
      }
    }

    return res.json({
      ano: Number(ano),
      totalMeses: 12,
      pagamentosGerados: pagamentosGerados.length,
      pagamentosFaltantes: mesesFaltantes.length,
      gerados: pagamentosGerados,
      faltantes: mesesFaltantes,
    })
  },

  /**
   * DELETE /pagamentos/cancelar-mes
   * Cancela todos os pagamentos pendentes de um mês
   */
  async cancelarPagamentosMes(req: Request, res: Response) {
    const { mes, ano, alunoId } = req.body

    const resultado = await prisma.pagamento.updateMany({
      where: {
        mesReferencia: mes,
        anoReferencia: ano,
        alunoId,
        status: 'PENDENTE',
        aluno: { escolaId: req.user?.escolaId, deletedAt: null },
      },
      data: {
        status: 'CANCELADO',
      },
    })

    return res.json({
      message: `${resultado.count} pagamento(s) cancelado(s)`,
      mes,
      ano,
    })
  },
}