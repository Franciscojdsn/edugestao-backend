import { z } from 'zod';

const TurnoEnum = z.enum(['MANHA', 'TARDE', 'NOITE', 'INTEGRAL']); // Ajuste conforme seu Prisma Enum

export const criarTurmaSchema = z.object({
  body: z.object({
    nome: z.string().min(3, 'Nome muito curto').max(100, 'Nome excede 100 caracteres').trim(),
    anoLetivo: z.number().int().min(2024, 'Ano letivo inválido').max(2100),
    turno: TurnoEnum,
    capacidadeMaxima: z.number().int().positive('Capacidade deve ser maior que zero').default(30),
    // O ID do professor responsável virá aqui para facilitar a criação do vínculo na controller
    professorResponsavelId: z.string().uuid().optional().nullable(),
  }),
});

export const atualizarTurmaSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de turma inválido'),
  }),
  body: criarTurmaSchema.shape.body.partial()
});

export const listarTurmasSchema = z.object({
  query: z.object({
    anoLetivo: z.coerce.number().int().optional(),
    turno: TurnoEnum.optional(),
    busca: z.string().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

/**
 * Schema para buscar por ID
 */
export const idTurmaSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de turma inválido'),
  }),
})
