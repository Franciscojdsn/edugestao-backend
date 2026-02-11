import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withEscolaId } from '../utils/prismaHelpers'

export const matriculaController = {
  /**
   * POST /matriculas/iniciar
   * Inicia processo de matrícula
   */
  async iniciar(req: Request, res: Response) {
    const dados = req.body
    const escolaId = req.user?.escolaId

    if (!escolaId) {
      throw new AppError('Escola não identificada no perfil do usuário', 403)
    }

    // Verificar turma
    const turma = await prisma.turma.findFirst({
      where: withEscolaId({ id: dados.turmaId }),
      include: {
        _count: { select: { alunos: true, matriculas: true } },
      },
    })
    if (!turma) throw new AppError('Turma não encontrada', 404)

    // Verificar capacidade
    if (turma.capacidadeMaxima && turma._count.alunos >= turma.capacidadeMaxima) {
      throw new AppError('Turma com capacidade máxima atingida', 400)
    }

    // Gerar número de matrícula único - CORRIGIDO
    const ano = dados.anoLetivo

    // Buscar TODAS as matrículas do ano (não só alunos)
    const ultimaMatricula = await prisma.matricula.findFirst({
      where: {
        escolaId,
        anoLetivo: ano,
      },
      orderBy: { numeroMatricula: 'desc' },
    })

    let proximoNumero = 1
    if (ultimaMatricula) {
      // Pegamos o que vem depois do ano
      const prefixoAno = ano.toString()
      const sequencialPuro = ultimaMatricula.numeroMatricula.startsWith(prefixoAno)
        ? ultimaMatricula.numeroMatricula.substring(prefixoAno.length)
        : ultimaMatricula.numeroMatricula.replace(/\D/g, '').slice(-3) // fallback de segurança

      proximoNumero = (parseInt(sequencialPuro) || 0) + 1
    }

    // 2. Gerar a matrícula (mínimo de 3 dígitos no sequencial)
    const numeroMatricula = `${ano}${proximoNumero.toString().padStart(3, '0')}`

    // Verificar se já existe (segurança extra)
    const matriculaExiste = await prisma.aluno.findUnique({
      where: { numeroMatricula },
    })

    if (matriculaExiste) {
      throw new AppError('Número de matrícula já existe. Tente novamente.', 400)
    }

    // Criar aluno
    const aluno = await prisma.aluno.create({
      data: {
        nome: dados.nomeAluno,
        cpf: dados.cpfAluno,
        dataNascimento: new Date(dados.dataNascimento),
        genero: dados.genero,
        naturalidade: dados.naturalidade,
        numeroMatricula,
        turno: dados.turno,
        escolaId: escolaId,
        turmaId: dados.turmaId,
      },
    })

    // Criar matrícula
    const matricula = await prisma.matricula.create({
      data: {
        numeroMatricula,
        anoLetivo: dados.anoLetivo,
        alunoId: aluno.id,
        turmaId: dados.turmaId,
        escolaId: escolaId,
        etapaAtual: 'RESPONSAVEIS',
        dadosPessoaisOk: true,
      },
      include: {
        aluno: { select: { nome: true, numeroMatricula: true } },
        turma: { select: { nome: true } },
      },
    })

    return res.status(201).json({
      message: 'Matrícula iniciada com sucesso',
      matricula,
      proximaEtapa: 'RESPONSAVEIS',
    })
  },

  /**
   * POST /matriculas/:matriculaId/responsaveis
   * Adiciona responsável à matrícula
   */
  async adicionarResponsavel(req: Request, res: Response) {
    const { matriculaId } = req.params
    const idFormatado = Array.isArray(matriculaId) ? matriculaId[0] : matriculaId
    const dados = req.body

    const matricula = await prisma.matricula.findFirst({
      where: {
        id: idFormatado,
        escola: { id: req.user?.escolaId },
      },
    })

    if (!matricula) throw new AppError('Matrícula não encontrada', 404)

    // Se marcar como financeiro, desmarcar outros
    if (dados.isResponsavelFinanceiro) {
      await prisma.responsavel.updateMany({
        where: {
          alunoId: matricula.alunoId,
          isResponsavelFinanceiro: true,
        },
        data: { isResponsavelFinanceiro: false },
      })
    }

    const responsavel = await prisma.responsavel.create({
      data: {
        ...dados,
        alunoId: matricula.alunoId,
      },
    })

    // Atualizar etapa se tiver pelo menos 1 responsável
    await prisma.matricula.update({
      where: { id: idFormatado },
      data: {
        responsaveisOk: true,
        etapaAtual: 'CONTRATO',
      },
    })

    return res.status(201).json({
      message: 'Responsável adicionado',
      responsavel,
      proximaEtapa: 'CONTRATO',
    })
  },

  /**
   * POST /matriculas/:matriculaId/finalizar
   * Finaliza matrícula criando contrato
   */
  async finalizar(req: Request, res: Response) {
    const { matriculaId } = req.params
    const idFormatado = Array.isArray(matriculaId) ? matriculaId[0] : matriculaId
    const { valorMensalidade, diaVencimento, responsavelFinanceiroId } = req.body

    const matricula = await prisma.matricula.findFirst({
      where: {
        id: idFormatado,
        escola: { id: req.user?.escolaId },
      },
      include: {
        aluno: true,
      },
    })

    if (!matricula) throw new AppError('Matrícula não encontrada', 404)

    // Verificar responsável financeiro
    const responsavel = await prisma.responsavel.findFirst({
      where: {
        id: responsavelFinanceiroId,
        alunoId: matricula.alunoId,
      },
    })

    if (!responsavel) throw new AppError('Responsável não encontrado', 404)

    // Criar contrato
    const contrato = await prisma.contrato.create({
      data: {
        // Em vez de passar alunoId direto, usamos o connect para garantir a relação
        aluno: {connect: { id: matricula.alunoId }},
        // Fazemos o mesmo para o responsável
        responsavelFinanceiro: {connect: { id: responsavelFinanceiroId }},
        // Adicione o escolaId que é obrigatório no seu sistema de multitenancy
        escola: {connect: { id: req.user?.escolaId }},
        
        valorMensalidade,
        diaVencimento,
        dataInicio: new Date(),
        ativo: true,
      },
    });

    // Atualizar matrícula
    await prisma.matricula.update({
      where: { id: idFormatado },
      data: {
        status: 'APROVADA',
        etapaAtual: 'FINALIZADA',
        contratoAssinado: true,
        pagamentoConfirmado: true,
      },
    })

    return res.json({
      message: 'Matrícula finalizada com sucesso!',
      numeroMatricula: matricula.numeroMatricula,
      contrato,
      aluno: matricula.aluno,
    })
  },

  /**
   * GET /matriculas
   * Lista matrículas
   */
  async list(req: Request, res: Response) {
    const { page = 1, limit = 20, status, anoLetivo, turmaId } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    let where: any = { escolaId: req.user?.escolaId }
    if (status) where.status = status
    if (anoLetivo) where.anoLetivo = Number(anoLetivo)
    if (turmaId) where.turmaId = turmaId

    const [matriculas, total] = await Promise.all([
      prisma.matricula.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          aluno: { select: { nome: true, numeroMatricula: true } },
          turma: { select: { nome: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.matricula.count({ where }),
    ])

    return res.json({
      data: matriculas,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    })
  },

  /**
   * GET /matriculas/:id
   * Detalhes da matrícula
   */
  async show(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const matricula = await prisma.matricula.findFirst({
      where: {
        id: idFormatado,
        escola: { id: req.user?.escolaId },
      },
      include: {
        aluno: {
          include: {
            responsaveis: true,
            endereco: true,
          },
        },
        turma: true,
      },
    })

    if (!matricula) throw new AppError('Matrícula não encontrada', 404)
    return res.json(matricula)
  },

  /**
   * PUT /matriculas/:id/status
   * Atualiza status da matrícula
   */
  async atualizarStatus(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id
    const { status, observacoes } = req.body

    const matricula = await prisma.matricula.findFirst({
      where: {
        id: idFormatado,
        escola: { id: req.user?.escolaId },
      },
    })

    if (!matricula) throw new AppError('Matrícula não encontrada', 404)

    const atualizada = await prisma.matricula.update({
      where: { id: idFormatado },
      data: { status, observacoes },
    })

    return res.json(atualizada)
  },

  /**
   * DELETE /matriculas/:id
   * Cancela matrícula (soft delete do aluno)
   */
  async cancelar(req: Request, res: Response) {
    const { id } = req.params
    const idFormatado = Array.isArray(id) ? id[0] : id

    const matricula = await prisma.matricula.findFirst({
      where: {
        id: idFormatado,
        escola: { id: req.user?.escolaId },
      },
    })

    if (!matricula) throw new AppError('Matrícula não encontrada', 404)

    // Soft delete do aluno
    await prisma.aluno.update({
      where: { id: matricula.alunoId },
      data: { deletedAt: new Date() },
    })

    // Cancelar matrícula
    await prisma.matricula.update({
      where: { id: idFormatado },
      data: { status: 'CANCELADA' },
    })

    return res.json({ message: 'Matrícula cancelada' })
  },
}