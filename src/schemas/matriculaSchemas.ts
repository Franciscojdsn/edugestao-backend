import { z } from 'zod'

export const iniciarMatriculaSchema = z.object({
  body: z.object({
    turmaId: z.string().uuid(),
    anoLetivo: z.number().int().min(2024).max(2030),
    
    // Dados do aluno
    nomeAluno: z.string().min(3),
    cpfAluno: z.string().optional(),
    dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    genero: z.string().optional(),
    naturalidade: z.string().optional(),
    turno: z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL']),
  }),
})

export const adicionarResponsavelSchema = z.object({
  params: z.object({
    matriculaId: z.string().uuid(),
  }),
  body: z.object({
    nome: z.string().min(3),
    cpf: z.string().optional(),
    telefone1: z.string().min(10),
    email: z.string().email().optional(),
    tipo: z.enum(['PAI', 'MAE', 'AVO', 'OUTRO']),
    isResponsavelFinanceiro: z.boolean().default(false),
  }),
})

export const finalizarMatriculaSchema = z.object({
  params: z.object({
    matriculaId: z.string().uuid(),
  }),
  body: z.object({
    valorMensalidade: z.number().positive(),
    diaVencimento: z.number().int().min(1).max(31),
    responsavelFinanceiroId: z.string().uuid(),
  }),
})

export const listarMatriculasSchema = z.object({
  query: z.object({
    status: z.enum(['PENDENTE', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'CANCELADA']).optional(),
    anoLetivo: z.string().regex(/^\d{4}$/).transform(Number).optional(),
    turmaId: z.string().uuid().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }).optional(),
})

export const atualizarEtapaSchema = z.object({
  params: z.object({
    matriculaId: z.string().uuid(),
  }),
  body: z.object({
    etapa: z.enum(['DADOS_PESSOAIS', 'DOCUMENTOS', 'RESPONSAVEIS', 'CONTRATO', 'PAGAMENTO', 'FINALIZADA']),
    concluida: z.boolean(),
  }),
})