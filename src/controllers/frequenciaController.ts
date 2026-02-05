import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AppError } from '../middlewares/errorHandler'
import { withEscolaId } from '../utils/prismaHelpers'

export const frequenciaController = {

  // Registrar a chamada (Presença/Ausência) - Modo Tradicional
  async registrarChamada(req: Request, res: Response) {
    const { turmaId, disciplinaId, data, presencas } = req.body;
    const escolaId = req.user?.escolaId;

    const dataFormatada = new Date(data);
    dataFormatada.setUTCHours(0, 0, 0, 0);

    // ALTERAÇÃO: Loop com create/update manual se o upsert der erro de tipagem no seu schema
    const promessas = presencas.map(async (p: any) => {
      const existente = await prisma.frequencia.findFirst({
        where: { alunoId: p.alunoId, data: dataFormatada, disciplinaId }
      });

      if (existente) {
        return prisma.frequencia.update({
          where: { id: existente.id },
          data: { presente: p.presente }
        });
      } else {
        return prisma.frequencia.create({
          data: {
            data: dataFormatada,
            presente: p.presente,
            escola: { connect: { id: escolaId } },
            aluno: { connect: { id: p.alunoId } }, // ALTERAÇÃO: Uso do connect
            turma: { connect: { id: turmaId } }, // ALTERAÇÃO: Uso do connect
            disciplina: { connect: { id: disciplinaId } }, // ALTERAÇÃO: Uso do connect
          }
        });
      }
    });

    const resultado = await Promise.all(promessas);
    return res.json({ mensagem: 'Chamada registrada', total: resultado.length });
  },

  // Registrar a chamada - Modo Inteligente (Detecta Fundamental I ou II)
  async prepararChamada(req: Request, res: Response) {
    const professorId = req.user?.userId; // Assumindo que o ID do professor está no token
    const escolaId = req.user?.escolaId;

    // 1. Pegar o momento atual (Dia e Hora)
    const agora = new Date();
    const diaSemana = agora.getDay(); // 0 (Dom) a 6 (Sáb)

    // No Fundamental I/II as aulas são durante a semana (1-5 ou 6)
    if (diaSemana === 0) throw new AppError('Não há aulas agendadas para domingo', 400);

    const horaAtual = agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // 2. Procurar a aula ativa na Grade Horária
    const aulaAtiva = await prisma.gradeHoraria.findFirst({
      where: {
        escolaId,
        diaSemana,
        horarioInicio: { lte: horaAtual },
        horarioFim: { gte: horaAtual },
        turmaDisciplina: { professorId: professorId }
      },
      include: {
        turma: {
          select: {
            id: true,
            nome: true,
            alunos: {
              where: { deletedAt: { equals: null } },
              select: { id: true, nome: true, numeroMatricula: true },
              orderBy: { nome: 'asc' }
            }
          }
        },
        turmaDisciplina: {
          include: { disciplina: { select: { id: true, nome: true } } }
        }
      }
    });

    if (!aulaAtiva) {
      throw new AppError('Nenhuma aula agendada para este horário ou você não é o professor desta disciplina.', 404);
    }

    // 3. Retornar tudo "mastigado" para o Frontend
    return res.json({
      infoAula: {
        turmaId: aulaAtiva.turmaId,
        turmaNome: aulaAtiva.turma.nome,
        disciplinaId: aulaAtiva.turmaDisciplina.disciplinaId,
        disciplinaNome: aulaAtiva.turmaDisciplina.disciplina.nome,
        horario: `${aulaAtiva.horarioInicio} - ${aulaAtiva.horarioFim}`
      },
      alunos: aulaAtiva.turma.alunos
    });
  },

  // Salvar a chamada inteligente (Fundamental I ou II) - Modo Inteligente
  async salvarChamadaInteligente(req: Request, res: Response) {
    const { turmaId, disciplinaId, presencas, data } = req.body;

    // Resolvendo o erro de tipo 'id' diretamente aqui:
    const usuario = req.user as { userId: string; escolaId: string };
    const escolaId = usuario.escolaId;

    const dataFormatada = new Date(data);
    dataFormatada.setUTCHours(0, 0, 0, 0);

    // 1. Detectar se é Fundamental I ou II por contagem de professores
    const professoresDistintos = await prisma.turmaDisciplina.groupBy({
      by: ['professorId'],
      where: { turmaId }
    });

    const isFundamental1 = professoresDistintos.length === 1;

    // 2. Executar gravação
    await prisma.$transaction(
      presencas.map((p: any) => {
        return prisma.frequencia.upsert({
          where: {
            // 1. Usando a chave composta EXATA que o seu Prisma gerou
            alunoId_turmaId_data_disciplinaId: {
              alunoId: p.alunoId,
              turmaId: turmaId,
              data: dataFormatada,
              disciplinaId: disciplinaId
            }
          },
          update: { presente: p.presente },
          create: {
            presente: p.presente,
            data: dataFormatada,
            // 2. Usando connect em tudo para evitar o erro de 'string' vs 'undefined'
            aluno: { connect: { id: p.alunoId } },
            turma: { connect: { id: turmaId } },
            disciplina: { connect: { id: disciplinaId } },
            escola: { connect: { id: escolaId } } // Alterado de escolaId: escolaId para connect
          }
        });
      })
    );

    return res.json({
      sucesso: true,
      modo: isFundamental1 ? "Fundamental I" : "Fundamental II"
    });
  },

  async listarChamadaRealizada(req: Request, res: Response) {
    const { turmaId, disciplinaId, data } = req.query;
    const escolaId = req.user?.escolaId;

    const dataFormatada = new Date(data as string);
    dataFormatada.setUTCHours(0, 0, 0, 0);

    const historico = await prisma.frequencia.findMany({
      where: {
        escolaId,
        turmaId: turmaId as string,
        disciplinaId: disciplinaId as string,
        data: dataFormatada
      },
      include: {
        aluno: { select: { id: true, nome: true } }
      },
      orderBy: { aluno: { nome: 'asc' } }
    });

    return res.json(historico);
  }
}