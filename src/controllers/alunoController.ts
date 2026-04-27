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

    const [alunos, total] = await Promise.all([
      // O prisma.$extends injetará `escolaId: '...'` automaticamente
      prisma.aluno.findMany({
        where,
        skip,
        take: Number(limit),
        include: { turma: { select: { nome: true } } },
        orderBy: { nome: 'asc' }
      }),
      prisma.aluno.count({ where })
    ]);

    return res.json({
      data: alunos,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit))
      }
    });
  },

  /**
   * GET /alunos/:id - Detalhes
   */
  async show(req: Request, res: Response) {
    const { id } = req.params;
    const idFormatado = Array.isArray(id) ? id[0] : id;

    // Usamos findFirst para garantir compatibilidade de injeção da extensão
    const aluno = await prisma.aluno.findFirst({
      where: { id: idFormatado },
      include: {
        endereco: true,
        turma: true,
        responsaveis: true,
        contrato: true
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
    const idFormatado = Array.isArray(id) ? id[0] : id;
    const dados = req.body; // Já validado pelo atualizarAlunoSchema

    const alunoExistente = await prisma.aluno.findFirst({ where: { id: idFormatado } });
    if (!alunoExistente) throw new AppError('Aluno não encontrado.', 404);

    const alunoAtualizado = await prisma.aluno.update({
      where: { id: idFormatado },
      data: dados // Dados já limpos e no limite de caracteres pelo Zod
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