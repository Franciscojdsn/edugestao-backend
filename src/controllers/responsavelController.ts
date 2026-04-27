import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'

export const responsavelController = {

  /**
   * GET /alunos/:alunoId/responsaveis
   */
  async listarPorAluno(req: Request, res: Response) {
    const { alunoId } = req.params;
    const idFormatado = Array.isArray(alunoId) ? alunoId[0] : alunoId;

    // A extensão Prisma já garante que o aluno pertence à escola atual
    // e que não está deletado (deletedAt: null).
    const aluno = await prisma.aluno.findFirst({
      where: { id: idFormatado },
      select: { id: true, nome: true, numeroMatricula: true }
    });

    if (!aluno) throw new AppError('Aluno não encontrado.', 404);

    const responsaveis = await prisma.responsavel.findMany({
      where: { alunoId: idFormatado },
      include: { endereco: true },
      orderBy: { nome: 'asc' }
    });

    return res.json({
      status: 'success',
      data: { aluno, responsaveis, total: responsaveis.length }
    });
  },

  /**
   * POST /responsaveis
   */
  async create(req: Request, res: Response) {
    const dados = req.body; // Já sanitizado pelo Zod

    // 1. Verifica se o aluno alvo pertence à escola (Segurança)
    const alunoExistente = await prisma.aluno.findFirst({
      where: { id: dados.alunoId }
    });
    if (!alunoExistente) throw new AppError('Aluno não encontrado.', 404);

    // 2. Proteção de Unicidade Composta (Evitar múltiplos inserts do mesmo pai)
    if (dados.cpf) {
      const conflito = await prisma.responsavel.findFirst({
        where: { cpf: dados.cpf, alunoId: dados.alunoId }
      });
      if (conflito) throw new AppError('Este responsável já está vinculado a este aluno.', 400);
    }

    // 3. Criação (escolaId é injetado automaticamente pela extensão)
    const novoResponsavel = await prisma.responsavel.create({
      data: { ...dados, alunoId: dados.alunoId }
    });

    return res.status(201).json({
      status: 'success',
      message: 'Responsável adicionado com sucesso.',
      data: novoResponsavel
    });
  },

  /**
   * PUT /responsaveis/:id
   */
  async update(req: Request, res: Response) {
    const id = req.params.id as string;
    const dados = req.body;

    const responsavel = await prisma.responsavel.findFirst({ 
      where: { id } 
    });
    if (!responsavel) throw new AppError('Responsável não encontrado.', 404);

    const atualizado = await prisma.responsavel.update({
      where: { id },
      data: dados
    });

    return res.json({
      status: 'success',
      message: 'Dados atualizados.',
      data: atualizado
    });
  },

  /**
   * DELETE /responsaveis/:id
   * Hard Delete Protegido (Conformidade Financeira)
   */
  async delete(req: Request, res: Response) {
    const id = req.params.id as string;

    const responsavel = await prisma.responsavel.findFirst({
      where: { id: id },
      include: { _count: { select: { contratos: true } } }
    });

    if (!responsavel) throw new AppError('Responsável não encontrado.', 404);

    // TRAVA FINANCEIRA: Não apaga se for pagador de um contrato
    if (responsavel._count.contratos > 0) {
      throw new AppError('Operação bloqueada. Este responsável possui contratos financeiros vinculados.', 403);
    }

    // Como Responsavel não tem deletedAt (pois é atrelado fisicamente ao aluno), fazemos delete direto.
    // A extensão garantirá que seja deletado apenas se pertencer à escola.
    await prisma.responsavel.delete({ where: { id } });

    return res.status(204).send();
  }
};