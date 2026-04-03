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
      throw new AppError('Escola não identificada', 403)
    }

    // 1. Verificar se a turma existe
    const turma = await prisma.turma.findFirst({
      where: withEscolaId({ id: dados.turmaId }),
      include: { _count: { select: { alunos: true } } }
    })
    if (!turma) throw new AppError('Turma não encontrada', 404)

    // 2. Lógica de Geração do Número de Matrícula (YY.RAND)
    const anoAbreviado = new Date().getFullYear().toString().slice(-2); // Ex: "26"
    let numeroMatricula = '';
    let matriculaExiste = true;
    let tentativas = 0;

    // Loop de segurança: tenta gerar um número único até 5 vezes
    while (matriculaExiste && tentativas < 5) {
      const random4 = Math.floor(1000 + Math.random() * 9000); // Gera entre 1000 e 9999
      numeroMatricula = `${anoAbreviado}.${random4}`;

      const conflito = await prisma.aluno.findFirst({
        where: {
          escolaId,
          numeroMatricula
        }
      });

      if (!conflito) {
        matriculaExiste = false;
      } else {
        tentativas++;
      }
    }

    if (matriculaExiste) {
      throw new AppError('Falha ao gerar número de matrícula único. Tente novamente.', 500);
    }

    // 3. Iniciar Transação para criar Aluno e Matrícula
    const resultado = await prisma.$transaction(async (tx) => {
      // Cria o Aluno (vinculado à escola)
      const novoAluno = await tx.aluno.create({
        data: {
          nome: dados.nomeAluno,
          cpf: dados.cpfAluno || null,
          dataNascimento: new Date(dados.dataNascimento),
          numeroMatricula,
          turmaId: dados.turmaId,
          escolaId,
          turno: dados.turno // Turno que agora vem automático do front
        }
      });

      // Cria a Matrícula (vinculada ao aluno)
      const novaMatricula = await tx.matricula.create({
        data: {
          alunoId: novoAluno.id,
          turmaId: dados.turmaId,
          escolaId,
          anoLetivo: Number(dados.anoLetivo),
          status: 'PENDENTE',
          numeroMatricula: numeroMatricula // Mantendo registro na tabela de matricula também
        }
      });

      return { aluno: novoAluno, matricula: novaMatricula };
    });

    return res.status(201).json({
      message: 'Matrícula iniciada com sucesso',
      matriculaId: resultado.matricula.id, // ID para o navigate do front
      numeroMatricula: resultado.aluno.numeroMatricula
    });
  },

  /**
   * POST /matriculas/:matriculaId/responsaveis
   * Adiciona responsável à matrícula
   */
  async adicionarResponsavel(req: Request, res: Response) {
    const { matriculaId } = req.params;
    const idFormatado = Array.isArray(matriculaId) ? matriculaId[0] : matriculaId;

    // 1. Destruímos o body para separar o que é controle (front) do que é banco
    const { usarEnderecoDoAluno, endereco, ...dadosLimpos } = req.body;
    const escolaId = req.user?.escolaId;

    // 2. Buscamos a matrícula trazendo o enderecoId do aluno vinculado
    const matricula = await prisma.matricula.findFirst({
      where: { id: idFormatado, escolaId },
      include: { aluno: { select: { enderecoId: true } } }
    });

    if (!matricula) throw new AppError('Matrícula não encontrada', 404);

    // 3. Lógica de definição do endereço
    let enderecoData = undefined;

    if (usarEnderecoDoAluno && matricula.aluno.enderecoId) {
      // Vincula ao endereço que o aluno já possui
      enderecoData = { connect: { id: matricula.aluno.enderecoId } };
    } else if (endereco && endereco.cep) {
      // Cria um novo endereço para o responsável
      enderecoData = {
        create: {
          rua: endereco.rua,
          numero: endereco.numero,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          estado: endereco.estado,
          cep: endereco.cep,
          complemento: endereco.complemento || null,
        }
      };
    }

    // 4. Criação do responsável
    const responsavel = await prisma.responsavel.create({
      data: {
        ...dadosLimpos, // nome, cpf (já limpo), email, telefone1, tipo, isResponsavelFinanceiro
        alunoId: matricula.alunoId,
        escolaId: escolaId,
        endereco: enderecoData
      },
    });

    // 5. Atualizar etapa para CONTRATO
    await prisma.matricula.update({
      where: { id: idFormatado },
      data: { responsaveisOk: true, etapaAtual: 'CONTRATO' },
    });

    return res.status(201).json({
      message: 'Responsável adicionado',
      responsavel,
      proximaEtapa: 'CONTRATO',
    });
  },

  /**
   * POST /matriculas/:matriculaId/finalizar
   * Finaliza matrícula criando contrato
   */
  async finalizar(req: Request, res: Response) {
    const { matriculaId } = req.params;
    const {
      valorMatricula,
      descontoMatricula,   // Descomente assim que rodar o prisma db push
      valorMensalidadeBase,
      descontoMensalidade,
      atividadesExtrasIds,
      diaVencimento,
      qtdParcelas,
      responsavelFinanceiroId
    } = req.body;

    const escolaId = req.user?.escolaId;
    if (!escolaId) throw new AppError('Tenant (escolaId) não identificado no token.', 403);

    const matriculaRascunho = await prisma.matricula.findFirst({
      where: { id: matriculaId.toString(), escolaId },
      include: { aluno: true }
    });

    if (!matriculaRascunho) throw new AppError('Matrícula não encontrada.', 404);

    // --- CÁLCULOS FINANCEIROS PRÉ-TRANSAÇÃO ---
    // 1. Busca os valores das atividades extras atreladas para compor a mensalidade
    const atividades = await prisma.atividadeExtra.findMany({
      where: { id: { in: atividadesExtrasIds }, escolaId }
    });

    const somaExtras = atividades.reduce((acc, curr) => acc + Number(curr.valor), 0);
    const totalMensalidade = (Number(valorMensalidadeBase) - Number(descontoMensalidade)) + somaExtras;

    // ATENÇÃO: Quando o banco estiver sincronizado, adicione o (valorMatricula - descontoMatricula) na parcela 1.
    const valorPrimeiraParcela = totalMensalidade;

    // --- TRANSAÇÃO ATÔMICA ---
    const resultado = await prisma.$transaction(async (tx) => {

      // A. Gerar Número Oficial (Mantido o seu código)
      const anoAbreviado = new Date().getFullYear().toString().slice(-2);
      const randomID = Math.floor(1000 + Math.random() * 9000);
      const numeroMatriculaOficial = `${anoAbreviado}.${randomID}`;

      // B. Efetivar Matrícula (Mantido o seu código)
      await tx.matricula.update({
        where: { id: matriculaId.toString() },
        data: { status: 'APROVADA', numeroMatricula: numeroMatriculaOficial }
      });

      // C. Criar o Contrato
      const contrato = await tx.contrato.create({
        data: {
          alunoId: matriculaRascunho.alunoId,
          responsavelFinanceiroId,
          escolaId,
          valorMensalidadeBase,
          descontoMensalidade,
          diaVencimento,
          quantidadeParcelas: qtdParcelas,
          dataInicio: new Date(),
          status: 'ATIVO'
        }
      });

      // D. Processar o "Carrinho" de Atividades Extras
      if (atividadesExtrasIds && atividadesExtrasIds.length > 0) {
        const vinculosExtras = atividadesExtrasIds.map((extraId: string) => ({
          alunoId: matriculaRascunho.alunoId,
          atividadeExtraId: extraId,
          ativo: true,
          dataInicio: new Date()
        }));
        await tx.alunoAtividadeExtra.createMany({ data: vinculosExtras });
      }

      // E. GERADOR DE BOLETOS (Integrado ao Model Boletos)
      const boletosData = [];
      const dataAtual = new Date();
      const mesInicial = dataAtual.getMonth() + 1; // Mês atual (1-12)
      const anoInicial = dataAtual.getFullYear();

      for (let i = 1; i <= qtdParcelas; i++) {
        // Cálculo de Mês e Ano de Referência
        let mesRef = mesInicial + (i - 1);
        let anoRef = anoInicial;

        while (mesRef > 12) {
          mesRef -= 12;
          anoRef += 1;
        }

        // Regra de Vencimento
        const vencimento = new Date(anoRef, mesRef - 1, diaVencimento);

        // Formatação da Referência (Ex: "04/2026")
        const mesFormatado = mesRef.toString().padStart(2, '0');
        const referenciaStr = `${mesFormatado}/${anoRef}`;

        boletosData.push({
          escolaId,
          alunoId: matriculaRascunho.alunoId,
          referencia: referenciaStr,
          mesReferencia: mesRef,
          anoReferencia: anoRef,

          // Engenharia Financeira
          valorBase: Number(valorMensalidadeBase) - Number(descontoMensalidade),
          valorAtividades: Number(somaExtras),
          valorTotal: i === 1 ? Number(valorPrimeiraParcela) : Number(totalMensalidade),

          dataVencimento: vencimento,
          status: 'PENDENTE',
          descricao: `Mensalidade Escolar - Parcela ${i}/${qtdParcelas}`
        });
      }

      // Salva os boletos (parcelas) em lote
      await tx.boletos.createMany({ data: boletosData as any[] });

      return {
        numeroMatricula: numeroMatriculaOficial,
        contratoId: contrato.id
      };
    });

    return res.status(200).json({
      message: "Matrícula finalizada! Contrato e Boletos gerados com sucesso.",
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