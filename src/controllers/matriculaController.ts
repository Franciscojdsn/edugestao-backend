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
          escolaId: escolaId,
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
          // Usamos scalar IDs para compatibilidade com a extensão de Multi-tenancy
          alunoId: novoAluno.id,
          turmaId: dados.turmaId,
          escolaId, // Explicitamente necessário para satisfazer a tipagem do Prisma
          status: 'PENDENTE',
          etapaAtual: 'RESPONSAVEIS',
          numeroMatricula,
          anoLetivo: turma.anoLetivo
        }
      });

      return {
        matriculaId: novaMatricula.id,
        alunoId: novoAluno.id,
        enderecoId: novoEndereco.id
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
    const escolaId = getRequiredEscolaId(); // Validação de contexto obrigatória

    // 2. Destruturação Blindada
    const {
      usarEnderecoDoAluno,
      endereco: enderecoData,
      ...dadosResponsavel
    } = req.body;

    // 3. Busca da Matrícula e Aluno (Isolamento de Dados)
    const matricula = await prisma.matricula.findUnique({
      where: {
        id: Array.isArray(matriculaId) ? matriculaId[0] : matriculaId
      },
      include: { aluno: { select: { enderecoId: true } } }
    });

    if (!matricula) throw new AppError('Matrícula não localizada.', 404);

    // 4. Lógica de Persistência do Endereço
    let enderecoFinalId: string | null = null;

    if (usarEnderecoDoAluno) {
      enderecoFinalId = matricula.aluno?.enderecoId;
    } else if (enderecoData) {
      // Cria novo endereço se não usar o do aluno
      const novoEnd = await prisma.endereco.create({
        data: {
          rua: enderecoData.rua,
          numero: enderecoData.numero,
          complemento: enderecoData.complemento,
          bairro: enderecoData.bairro,
          cidade: enderecoData.cidade,
          estado: enderecoData.estado,
          cep: enderecoData.cep.replace(/\D/g, ''),
          escolaId
        }
      });
      enderecoFinalId = novoEnd.id;
    }

    // Usamos transação para garantir que o responsável seja criado e vinculado à matrícula
    const responsavel = await prisma.$transaction(async (tx) => {
      const idFormatado = Array.isArray(matriculaId) ? matriculaId[0] : matriculaId;
      const res = await tx.responsavel.create({
        data: {
          ...dadosResponsavel,
          cpf: dadosResponsavel.cpf?.replace(/\D/g, ''),
          telefone1: dadosResponsavel.telefone1?.replace(/\D/g, ''),
          telefone2: dadosResponsavel.telefone2?.replace(/\D/g, ''),
          alunoId: matricula.alunoId,
          escolaId,
          enderecoId: enderecoFinalId,
        }
      });

      // Vincula o responsável à matrícula para o Passo 3
      await tx.matricula.update({
        where: { id: idFormatado },
        data: { responsavelId: res.id }
      });

      return res;
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

    const matricula = await prisma.matricula.findFirst({
      where: { id: idFormatado, escolaId },
      include: { aluno: true, contrato: true }
    });

    if (!matricula) throw new AppError('Matrícula não encontrada no escopo deste tenant.', 404);

    const atividades = await prisma.atividadeExtra.findMany({
      where: { id: { in: dados.atividadesExtrasIds }, escolaId }
    });
    const valorTotalExtras = atividades.reduce((acc, curr) => acc + Number(curr.valor), 0);

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Geração do Contrato com qtd baseada no tamanho do array
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
          anoFaturamento: dados.anoReferencia,
          mesesFaturamento: dados.mesesSelecionados,
          status: 'ATIVO',
        }
      });

      // 2. Vínculo Pedagógico e Financeiro das Atividades Extras
      if (dados.atividadesExtrasIds?.length > 0) {
        await tx.alunoAtividadeExtra.createMany({
          data: dados.atividadesExtrasIds.map((atvId: string) => ({
            alunoId: matricula.alunoId,
            atividadeExtraId: atvId,
            escolaId,
            ativo: true,
            dataInicio: new Date(),
          })),
        });
      }

      // 3. Geração Segura do Livro de Recebíveis iterando o array explícito
      const boletosCriados = [];
      const valorMensalFinal = (dados.valorMensalidadeBase - dados.descontoMensalidade) + valorTotalExtras;
      const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      for (const mesAtual of dados.mesesSelecionados) {
        const referencia = `${mesesNomes[mesAtual - 1]}/${dados.anoReferencia}`;

        const dataVencimento = new Date(Date.UTC(dados.anoReferencia, mesAtual - 1, dados.diaVencimento, 12, 0, 0));

        if (dataVencimento.getUTCMonth() !== (mesAtual - 1)) {
          dataVencimento.setUTCDate(0);
        }

        const boleto = await tx.boletos.create({
          data: {
            alunoId: matricula.alunoId,
            escolaId,
            mesReferencia: mesAtual,
            anoReferencia: dados.anoReferencia,
            valorBase: dados.valorMensalidadeBase - dados.descontoMensalidade,
            valorAtividades: valorTotalExtras,
            valorTotal: valorMensalFinal,
            dataVencimento,
            status: 'PENDENTE',
            descricao: `${referencia}`
          }
        });
        boletosCriados.push(boleto);
      }

      // 4. Efetivação da Matrícula
      await tx.matricula.update({
        where: { id: idFormatado },
        data: {
          status: 'APROVADA',
          etapaAtual: 'FINALIZADA',
          contratoId: contrato.id,
          responsaveisOk: true
        }
      });

      return { contratoId: contrato.id, parcelas: boletosCriados.length };
    });

    await logger.audit({
      entidade: 'Contrato',
      acao: 'CREATE_MATRICULA_FINALIZADA',
      entidadeId: resultado.contratoId,
      escolaId,
      usuarioId: req.user?.userId,
      dadosNovos: { matriculaId, parcelasGeradas: resultado.parcelas }
    });

    return res.status(201).json({
      status: 'success',
      message: 'Matrícula e Contrato selados com sucesso.',
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

  /**
   * GET /matriculas/enderecos/:id
   * Busca um endereço pelo ID, garantindo multi-tenancy.
   */
  async getEnderecoById(req: Request, res: Response) {
    const { id } = req.params;
    const escolaId = getRequiredEscolaId();

    const endereco = await prisma.endereco.findFirst({
      where: {
        id: Array.isArray(id) ? id[0] : id,
        escolaId,
      },
    });

    if (!endereco) {
      throw new AppError('Endereço não encontrado ou não pertence à sua escola.', 404);
    }

    return res.json({ status: 'success', data: endereco });
  },
}