import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/errorHandler';

export const escolaController = {
  /**
   * GET /escolas/me
   * Retorna os dados da escola do usuário logado
   */
  async show(req: Request, res: Response) {
    // SEGURANÇA: Nunca usamos o ID da URL se pudermos usar o ID do Token
    const escolaId = req.user?.escolaId;

    if (!escolaId) throw new AppError('Contexto de escola não encontrado.', 401);

    const escola = await prisma.escola.findFirst({
      where: { id: String(escolaId) }, // Padrão String(id) solicitado
      include: {
        _count: {
          select: { alunos: true, turmas: true, funcionarios: true }
        }
      }
    });

    if (!escola) throw new AppError('Escola não encontrada.', 404);

    return res.json({ status: 'success', data: escola });
  },

  /**
   * PUT /escolas/:id
   * Atualiza as configurações da instituição
   */
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const dados = req.body;
    const userEscolaId = req.user?.escolaId;

    // BLOQUEIO ARQUITETURAL: Uma escola não edita outra.
    if (id !== userEscolaId) {
      throw new AppError('Violação de Tenancy: Você não tem permissão para alterar outra instituição.', 403);
    }

    const escolaAtualizada = await prisma.escola.update({
      where: { id: String(id) },
      data: dados
    });

    // Auditoria de alteração de configurações globais
    console.log(`[AUDIT] Configurações da escola ${id} alteradas por ${req.user?.userId}`);

    return res.json({
      status: 'success',
      message: 'Configurações da instituição atualizadas.',
      data: escolaAtualizada
    });
  }
};