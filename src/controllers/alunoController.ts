import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'

export const alunoController = {
  /**
   * GET /alunos - Listar com filtros e paginação
   * Totalmente protegido pela Prisma Extension (injeta escolaId e deletedAt: null)
   */
  async list(req: Request, res: Response) {
    const { page = 1, limit = 10, turmaId, busca, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let where: any = {};

    if (turmaId) where.turmaId = turmaId;
    if (status === 'ATIVO') where.contrato = { ativo: true };

    if (busca) {
      where.OR = [
        { nome: { contains: String(busca), mode: 'insensitive' } },
        { numeroMatricula: { contains: String(busca) } },
      ];
    }

    const hoje = new Date();
    const hojeInicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    const [alunos, total] = await Promise.all([
      // O prisma.$extends injetará `escolaId: '...'` automaticamente
      prisma.aluno.findMany({
        where,
        skip,
        take: Number(limit),
        include: { 
          turma: { select: { nome: true, turno: true } },
          boletos: {
            where: {
              status: { in: ['PENDENTE', 'VENCIDO'] },
              dataVencimento: { lt: hojeInicioDia }
            },
            take: 1, // Só precisamos saber se existe ao menos um boleto atrasado
            select: { id: true }
          }
        },
        orderBy: { nome: 'asc' }
      }),
      prisma.aluno.count({ where })
    ]);

    const alunosComStatus = alunos.map(aluno => ({
      ...aluno,
      financeiroStatus: aluno.boletos.length > 0 ? 'INADIMPLENTE' : 'EM_DIA',
      // Removemos a lista de boletos do payload final para economizar banda
      boletos: undefined
    }));

    return res.json({
      status: 'success',
      data: alunosComStatus,
      meta: {
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  },

  /**
   * GET /alunos/:id - Detalhes
   */
  async show(req: Request, res: Response) {
    const { id } = req.params;
    const idFormatado = String(id); // Garantir UUID string[cite: 7]

    const aluno = await prisma.aluno.findFirst({
      where: { id: idFormatado },
      include: {
        endereco: true,
        turma: true,
        responsaveis: true,
        contrato: true,
        boletos: {
          where: { deletedAt: null }, // Respeita Soft Delete[cite: 5]
          orderBy: { dataVencimento: 'asc' }
        }
      }
    });

    if (!aluno) throw new AppError('Aluno não encontrado.', 404);

    return res.json(aluno);
  },

  /**
   * PUT /alunos/:id - Atualizar
   */
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const idFormatado = String(id);
    
    // Destruturamos apenas os campos que pertencem ao modelo Aluno
    // E capturamos os campos de endereço que o frontend também envia
    const {
      nome, cpf, dataNascimento, naturalidade, genero,
      numeroMatricula, numeroSus, planoSaude, hospital, alergias,
      turmaId,
      cep, logradouro, numero, complemento, bairro, cidade, estado
    } = req.body;

    const alunoExistente = await prisma.aluno.findFirst({ where: { id: idFormatado } });
    if (!alunoExistente) throw new AppError('Aluno não encontrado.', 404);

    // 1. Atualização do Endereço (se houver dados de endereço no payload)
    if (alunoExistente.enderecoId && (cep || logradouro || bairro)) {
      await prisma.endereco.update({
        where: { id: alunoExistente.enderecoId },
        data: {
          cep,
          rua: logradouro, // Mapeamos 'logradouro' do front para 'rua' no banco
          numero,
          complemento,
          bairro,
          cidade,
          estado
        }
      });
    }

    // 2. Atualização do Aluno com data convertida e campos filtrados
    const alunoAtualizado = await prisma.aluno.update({
      where: { id: idFormatado },
      data: {
        nome,
        cpf,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined,
        naturalidade,
        genero,
        numeroMatricula,
        numeroSus,
        planoSaude,
        hospital,
        alergias,
        turmaId: turmaId || null
      }
    });

    return res.json({
      status: 'success',
      message: 'Dados do aluno atualizados com sucesso.',
      data: alunoAtualizado
    });
  },

  /**
   * DELETE /alunos/:id - Soft Delete Seguro
   */
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const idFormatado = Array.isArray(id) ? id[0] : id;

    const alunoExistente = await prisma.aluno.findFirst({ where: { id: idFormatado } });
    if (!alunoExistente) throw new AppError('Aluno não encontrado.', 404);

    // Como configuramos a extensão, isso será feito apenas para a escola atual
    await prisma.aluno.update({
      where: { id: idFormatado },
      data: { deletedAt: new Date() }
    });

    return res.status(204).send();
  }
};