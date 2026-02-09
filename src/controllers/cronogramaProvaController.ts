import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'

export const cronogramaProvaController = {
    // Criar o cronograma para uma turma específica
    async create(req: Request, res: Response) {
        const { turmaId, disciplinasPorDia } = req.body; // Array de { data, disciplinaId, ordem }
        const escolaId = req.user?.escolaId;

        const registros = await prisma.$transaction(
            disciplinasPorDia.map((item: any) =>
                prisma.cronogramaProva.create({
                    data: {
                        data: new Date(item.data),
                        ordem: item.ordem || 1,
                        turmaId,
                        disciplinaId: item.disciplinaId,
                        escolaId: escolaId!
                    }
                })
            )
        );

        return res.status(201).json(registros);
    },

    // Rota para o Portal do Responsável
    async portalResponsavel(req: Request, res: Response) {
        const turmaId = req.params.id as string;
        const { dataInicio, dataFim } = req.query;

        const provas = await prisma.cronogramaProva.findMany({
            where: {
                turmaId,
                data: {
                    gte: dataInicio ? new Date(dataInicio as string) : undefined,
                    lte: dataFim ? new Date(dataFim as string) : undefined,
                }
            },
            include: {
                disciplina: { select: { nome: true } }
            },
            orderBy: [
                { data: 'asc' },
                { ordem: 'asc' }
            ]
        });

        return res.json(provas);
    },

  // Rota para copiar cronograma de uma turma para outras turmas
  async copiar(req: Request, res: Response) {
        const { turmaOrigemId, turmasDestinoIds, dataInicio, dataFim } = req.body;
        const escolaId = req.user?.escolaId;

        if (!turmasDestinoIds || !Array.isArray(turmasDestinoIds)) {
            throw new AppError('Selecione ao menos uma turma de destino.', 400);
        }

        // 1. Buscar as provas da turma de origem no período selecionado
        const provasOrigem = await prisma.cronogramaProva.findMany({
            where: {
                turmaId: turmaOrigemId,
                escolaId,
                data: {
                    gte: new Date(dataInicio),
                    lte: new Date(dataFim)
                }
            }
        });

        if (provasOrigem.length === 0) {
            throw new AppError('Nenhum cronograma encontrado na turma de origem para este período.', 404);
        }

        // 2. Executar a cópia em massa via Transação
        const resultado = await prisma.$transaction(async (tx) => {
            const criacoes = [];

            for (const turmaDestinoId of turmasDestinoIds) {
                // Opcional: Limpar cronogramas existentes na turma de destino para evitar duplicidade
                await tx.cronogramaProva.deleteMany({
                    where: {
                        turmaId: turmaDestinoId,
                        escolaId,
                        data: { gte: new Date(dataInicio), lte: new Date(dataFim) }
                    }
                });

                // Preparar os novos registros baseados na origem
                for (const prova of provasOrigem) {
                    criacoes.push(
                        tx.cronogramaProva.create({
                            data: {
                                data: prova.data,
                                ordem: prova.ordem,
                                disciplinaId: prova.disciplinaId,
                                turmaId: turmaDestinoId,
                                escolaId: escolaId!
                            }
                        })
                    );
                }
            }
            return Promise.all(criacoes);
        });

        return res.status(201).json({
            mensagem: `Cronograma replicado com sucesso para ${turmasDestinoIds.length} turmas.`,
            totalRegistros: resultado.length
        });
    }
};