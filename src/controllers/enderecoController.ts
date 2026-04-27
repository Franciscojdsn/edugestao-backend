import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

export const enderecoController = {
  /**
   * GET /enderecos - Lista todos os endereços da escola atual
   */
  async list(req: Request, res: Response) {
    const enderecos = await prisma.endereco.findMany({
      select: {
        id: true,
        rua: true,
        numero: true,
        bairro: true,
        cidade: true,
        estado: true,
        cep: true,
        _count: {
          select: {
            alunos: true,
            responsaveis: true,
            funcionarios: true,
          },
        },
      },
      orderBy: { cidade: 'asc' },
    });

    return res.json({ status: 'success', data: enderecos, total: enderecos.length });
  },

  /**
   * GET /enderecos/:id - Exibe um endereço se pertencer à escola
   */
  async show(req: Request, res: Response) {
    const { id } = req.params;

    const endereco = await prisma.endereco.findFirst({
      where: { id: String(id) },
      include: {
        alunos: { select: { id: true, nome: true, numeroMatricula: true } },
        responsaveis: { select: { id: true, nome: true, tipo: true } },
        funcionarios: { select: { id: true, nome: true, cargo: true } }
      },
    });

    if (!endereco) throw new AppError('Endereço não encontrado ou não pertence a esta escola.', 404);

    return res.json({ status: 'success', data: endereco });
  },

  /**
   * POST /enderecos - Criar endereço (A extensão injeta a escola)
   */
  async create(req: Request, res: Response) {
    const dados = req.body;

    const endereco = await prisma.endereco.create({
      data: dados,
    });

    return res.status(201).json({ status: 'success', data: endereco });
  },

  /**
   * PUT /enderecos/:id
   */
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const dados = req.body;

    // Busca com findFirst para garantir que o tenant seja validado
    const enderecoExistente = await prisma.endereco.findFirst({
      where: { id: String(id) },
    });

    if (!enderecoExistente) throw new AppError('Endereço não encontrado.', 404);

    const endereco = await prisma.endereco.update({
      where: { id: String(id) },
      data: dados,
    });

    return res.json({ status: 'success', data: endereco });
  },

  /**
   * DELETE /enderecos/:id - Trava de Relacionamento
   */
  async delete(req: Request, res: Response) {
    const { id } = req.params;

    const endereco = await prisma.endereco.findFirst({
      where: { id: String(id) },
      include: {
        _count: {
          select: {
            alunos: true,
            responsaveis: true,
            funcionarios: true,
          },
        },
      },
    });

    if (!endereco) throw new AppError('Endereço não encontrado.', 404);

    // Trava de Integridade: Não podemos apagar endereço que está em uso
    const totalUso = endereco._count.alunos + endereco._count.responsaveis + endereco._count.funcionarios;
    if (totalUso > 0) {
      throw new AppError(`Operação bloqueada. Este endereço está vinculado a ${totalUso} registro(s).`, 403);
    }

    await prisma.endereco.delete({ where: { id: String(id) } });

    return res.status(204).send();
  },
};