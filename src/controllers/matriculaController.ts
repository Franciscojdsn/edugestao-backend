import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withEscolaId } from '../utils/prismaHelpers'
import { getRequiredEscolaId } from '../utils/context'
import { logger } from '../utils/logger'

export const matriculaController = {
  /**
   * POST /matriculas/iniciar
   * Inicia processo de matrícula
   */
  async iniciar(req: Request, res: Response) {
    const dados = req.body;
    const escolaId = getRequiredEscolaId(); // Validação de contexto obrigatória

    // 1. Verificação de Turma (A extensão do Prisma filtrará por escolaId automaticamente)
    const turma = await prisma.turma.findUnique({
      where: { id: dados.turmaId }
    });

    if (!turma) throw new AppError('Turma não encontrada ou não pertence à sua escola.', 404);

    // 2. Geração Segura do Número de Matrícula (Padrão: ANO + RANDOM 4)
    const anoAbreviado = new Date().getFullYear().toString().slice(-2);
    let numeroMatricula = '';
    let tentativas = 0;
    let disponivel = false;

    while (!disponivel && tentativas < 5) {
      const random4 = Math.floor(1000 + Math.random() * 9000);
      numeroMatricula = `${anoAbreviado}.${random4}`;

      const conflito = await prisma.aluno.findFirst({
        where: { numeroMatricula } // A extensão injeta o escolaId aqui
      });

      if (!conflito) disponivel = true;
      else tentativas++;
    }

    if (!disponivel) throw new AppError('Falha ao gerar número de matrícula único. Tente novamente.', 500);

    // 3. EXECUÇÃO ATÔMICA DA TRANSAÇÃO
    const resultado = await prisma.$transaction(async (tx) => {

      // A. Criação do Endereço (Sanitizado)
      const novoEndereco = await tx.endereco.create({
        data: {
          cep: dados.endereco.cep.replace(/\D/g, ''),
          rua: dados.endereco.rua.trim(),
          numero: String(dados.endereco.numero),
          complemento: dados.endereco.complemento?.trim() || null,
          bairro: dados.endereco.bairro.trim(),
          cidade: dados.endereco.cidade.trim(),
          estado: dados.endereco.uf.substring(0, 2).toUpperCase(),
        }
      });

      // B. Criação do Aluno (Multi-tenancy via Extensão)
      const novoAluno = await tx.aluno.create({
        data: {
          escolaId,
          nome: dados.nomeAluno.trim(),
          cpf: dados.cpf ? dados.cpf.replace(/\D/g, "") : null,
          dataNascimento: new Date(dados.dataNascimento),
          genero: dados.genero,
          numeroMatricula,
          turmaId: dados.turmaId,
          enderecoId: novoEndereco.id,

          // Dados de Saúde - Integrados
          numeroSus: dados.numeroSus?.replace(/\D/g, '') || null,
          planoSaude: Boolean(dados.planoSaude),
          hospital: dados.hospital?.trim() || null,
          alergias: dados.alergias?.trim() || null,
        }
      });

      // C. Registro Inicial do Wizard de Matrícula
      const novaMatricula = await tx.matricula.create({
        data: {
          alunoId: novoAluno.id,
          escolaId,
          turmaId: dados.turmaId,
          anoLetivo: Number(dados.anoLetivo),
          status: 'PENDENTE',
          etapaAtual: 'RESPONSAVEIS',
          numeroMatricula
        }
      });

      return {
        matriculaId: novaMatricula.id,
        alunoId: novoAluno.id
      };
    });

    return res.status(201).json({
      status: 'success',
      message: 'Etapa 1: Dados do aluno processados com sucesso.',
      data: resultado
    });
  },

  /**
   * POST /matriculas/:matriculaId/responsaveis
   * Adiciona responsável à matrícula
   */
  async adicionarResponsavel(req: Request, res: Response) {
    // 1. Captura correta do parâmetro da rota (/:matriculaId)
    const { matriculaId } = req.params;
    const { escolaId } = req.user as { escolaId: string }; // Segurança Multi-tenant

    // 2. Destruturação Blindada
    // Removemos 'endereco' (objeto do formulário) para que ele não vaze no '...dadosResponsavel'
    const {
      usarEnderecoDoAluno,
      enderecoId: enderecoFrontId,
      endereco, // Objeto de endereço vindo do form (ignorado se for herança)
      ...dadosResponsavel
    } = req.body;

    // 3. Busca da Matrícula e Aluno (Isolamento de Dados)
    const matricula = await prisma.matricula.findFirst({
      where: { id: matriculaId.toString(), escolaId },
      include: { aluno: { select: { enderecoId: true } } }
    });

    if (!matricula) throw new AppError('Matrícula não localizada.', 404);

    // 4. Lógica de Decisão do Endereço (UUID v4)
    let enderecoFinalId: string | null = null;

    if (usarEnderecoDoAluno === true) {
      enderecoFinalId = matricula.aluno?.enderecoId;
    } else {
      enderecoFinalId = enderecoFrontId;
    }

    // 5. Persistência usando o campo FK diretamente (Mais performático)
    // Usamos 'enderecoId' em vez do objeto 'endereco' para evitar o erro de validação
    const responsavel = await prisma.responsavel.create({
      data: {
        ...dadosResponsavel,
        alunoId: matricula.alunoId,
        escolaId,
        enderecoId: enderecoFinalId, // Grava o UUID diretamente
      }
    });

    return res.status(201).json(responsavel);
  },

  /**
   * POST /matriculas/:matriculaId/finalizar
   * Finaliza matrícula criando contrato
   */
  async finalizar(req: Request, res: Response) {
    const { matriculaId } = req.params;
    const idFormatado = Array.isArray(matriculaId) ? matriculaId[0] : matriculaId;
    const dados = req.body;
    const escolaId = getRequiredEscolaId();

    // 1. Validar Matrícula e Buscar Aluno
    const matricula = await prisma.matricula.findUnique({
      where: { id: idFormatado },
      include: { aluno: true }
    });
    if (!matricula) throw new AppError('Matrícula não encontrada.', 404);

    // 2. Calcular Atividades Extras (Segurança: Busca valor real do Banco)
    const atividades = await prisma.atividadeExtra.findMany({
      where: { id: { in: dados.atividadesExtrasIds } }
    });
    const valorTotalExtras = atividades.reduce((acc, curr) => acc + Number(curr.valor), 0);

    // 3. TRANSAÇÃO FINANCEIRA ATÔMICA
    const resultado = await prisma.$transaction(async (tx) => {

      // A. Criar o Contrato
      const contrato = await tx.contrato.create({
        data: {
          escolaId,
          alunoId: matricula.alunoId,
          responsavelFinanceiroId: dados.responsavelFinanceiroId,
          valorMatricula: dados.valorMatricula,
          descontoMatricula: dados.descontoMatricula,
          valorMensalidadeBase: dados.valorMensalidadeBase,
          descontoMensalidade: dados.descontoMensalidade,
          diaVencimento: dados.diaVencimento,
          quantidadeParcelas: dados.qtdParcelas,
          status: 'ATIVO',
        }
      });

      // B. Gerar Parcelas (Boletos)
      const boletosCriados = [];
      const valorMensalFinal = (dados.valorMensalidadeBase - dados.descontoMensalidade) + valorTotalExtras;

      for (let i = 0; i < dados.qtdParcelas; i++) {
        const dataVencimento = new Date(dados.dataInicioPagamento);
        dataVencimento.setMonth(dataVencimento.getMonth() + i);
        dataVencimento.setDate(dados.diaVencimento);

        const boleto = await tx.boletos.create({
          data: {
            alunoId: matricula.alunoId,
            escolaId,
            referencia: `Parcela ${i + 1}/${dados.qtdParcelas}`,
            mesReferencia: dataVencimento.getMonth() + 1,
            anoReferencia: dataVencimento.getFullYear(),
            valorBase: dados.valorMensalidadeBase - dados.descontoMensalidade,
            valorAtividades: valorTotalExtras,
            valorTotal: valorMensalFinal,
            dataVencimento,
            status: 'PENDENTE',
          }
        });
        boletosCriados.push(boleto);
      }


      return { contratoId: contrato.id, parcelas: boletosCriados.length };
    });

    // 4. Auditoria (Opcional: Disparar log de fechamento de contrato)
    await logger.audit({
      entidade: 'Contrato',
      acao: 'CREATE',
      entidadeId: resultado.contratoId,
      escolaId,
      usuarioId: req.user?.userId,
      dadosNovos: { matriculaId, parcelas: resultado.parcelas }
    });

    return res.status(201).json({
      status: 'success',
      message: 'Matrícula e Contrato finalizados com sucesso.',
      data: resultado
    });
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