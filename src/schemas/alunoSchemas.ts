import { z } from 'zod'

// Schema para criar aluno
export const criarAlunoSchema = z.object({
  body: z.object({
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    cpf: z.string()
      .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
      .optional(),
    dataNascimento: z.string().datetime().optional(),
    numeroMatricula: z.string().min(1, 'Número de matrícula é obrigatório'),
    turno: z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL']).optional(),
    turmaId: z.string().uuid().optional(),
    enderecoId: z.string().uuid().optional(),
  }),
})

// Schema para atualizar aluno
export const atualizarAlunoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    nome: z.string().min(3).optional(),
    cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/).optional(),
    dataNascimento: z.string().datetime().optional(),
    turno: z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL']).optional(),
    turmaId: z.string().uuid().optional(),
    enderecoId: z.string().uuid().optional(),
  }),
})

// Schema para listar alunos (com filtros)
export const listarAlunosSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    turmaId: z.string().uuid().optional(),
    turno: z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL']).optional(),
    busca: z.string().optional(), // Busca por nome
  }).optional(),
})
