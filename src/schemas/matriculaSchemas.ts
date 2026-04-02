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
    matriculaId: z.string().uuid("ID de matrícula inválido"),
  }),
  // Remova o segundo "body: z.object({" que estava aqui
  body: z.object({
    nome: z.string().min(3, "Nome muito curto"),
    cpf: z.string().optional().nullable(),
    email: z.string().email("Email inválido").optional().nullable(),
    telefone1: z.string().optional().nullable(),
    // Verifique se o front envia exatamente um desses:
    tipo: z.enum(['PAI', 'MAE', 'AVO', 'OUTRO']),
    isResponsavelFinanceiro: z.boolean(),
    usarEnderecoDoAluno: z.boolean(),
    endereco: z.object({
      cep: z.string().optional().nullable(),
      rua: z.string().optional().nullable(),
      numero: z.string().optional().nullable(),
      bairro: z.string().optional().nullable(),
      cidade: z.string().optional().nullable(),
      estado: z.string().max(2).optional().nullable(),
      complemento: z.string().optional().nullable(),
    }).optional().nullable(),
  }),
});


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