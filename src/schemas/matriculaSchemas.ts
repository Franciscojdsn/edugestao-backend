import { z } from 'zod'

export const iniciarMatriculaSchema = z.object({
  body: z.object({
    turmaId: z.string().uuid("O ID da turma deve ser um UUID válido."),
    anoLetivo: z.number().int().min(2024),

    // Dados Pessoais do Aluno
    nomeAluno: z.string().min(3, "Nome muito curto"),
    cpf: z.string().optional().nullable(),
    dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)"),
    genero: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),

    // Novos Campos: Saúde
    numeroSus: z.string().optional().nullable(),
    planoSaude: z.boolean().default(false),
    hospital: z.string().optional().nullable(),
    matriculaPlano: z.string().optional().nullable(),

    // Novo Campo: Endereço (Será isolado no DB)
    endereco: z.object({
      cep: z.string().min(8, "CEP inválido"),
      rua: z.string().min(2, "Rua é obrigatória"),
      numero: z.string().min(1, "Número é obrigatório"),
      complemento: z.string().optional().nullable(),
      bairro: z.string().min(2, "Bairro é obrigatório"),
      cidade: z.string().min(2, "Cidade é obrigatória"),
      estado: z.string().length(2, "Use a sigla do estado (ex: SP)")
    }).optional().nullable() // Opcional nesta etapa, mas recomendado
  }),
})

export const adicionarResponsavelSchema = z.object({
  params: z.object({
    matriculaId: z.string().uuid("ID de matrícula deve ser um UUID válido."),
  }),
  body: z.object({
    nome: z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
    cpf: z.string().min(11, "CPF inválido."), // Obrigatório para validação de contrato futuro
    rg: z.string().optional().nullable(),
    telefone1: z.string().min(10, "Telefone principal inválido."),
    telefone2: z.string().optional().nullable(),
    email: z.string().email("E-mail inválido.").optional().nullable(),
    tipo: z.enum(['PAI', 'MAE', 'AVO', 'TUTOR', 'OUTRO']),
    isResponsavelFinanceiro: z.boolean(),
    usarEnderecoDoAluno: z.boolean(),

    // O endereço só é validado se usarEnderecoDoAluno for false
    endereco: z.object({
      cep: z.string().min(8).optional().nullable(),
      rua: z.string().min(2).optional().nullable(),
      numero: z.string().min(1).optional().nullable(),
      bairro: z.string().min(2).optional().nullable(),
      cidade: z.string().min(2).optional().nullable(),
      estado: z.string().length(2).optional().nullable(),
      complemento: z.string().optional().nullable(),
    }).optional().nullable()
  }).refine((data) => {
    // Validação condicional: se não usar o do aluno, o endereço próprio deve estar preenchido
    if (!data.usarEnderecoDoAluno) {
      return data.endereco && data.endereco.cep && data.endereco.rua;
    }
    return true;
  }, {
    message: "Endereço é obrigatório caso não resida com o aluno.",
    path: ["endereco"]
  })
});


export const finalizarMatriculaSchema = z.object({
  params: z.object({
    matriculaId: z.string().uuid("ID da matrícula deve ser um UUID válido."),
  }),
  body: z.object({
    valorMatricula: z.number().min(0),
    descontoMatricula: z.number().min(0),
    valorMensalidadeBase: z.number().positive("A mensalidade base deve ser maior que zero."),
    descontoMensalidade: z.number().min(0),
    atividadesExtrasIds: z.array(z.string().uuid()).optional().default([]), // Nosso carrinho
    diaVencimento: z.number().int().min(1).max(31),
    qtdParcelas: z.number().int().min(1).max(12, "O máximo de parcelas por contrato é 12."),
    responsavelFinanceiroId: z.string().uuid("Responsável financeiro é obrigatório."),
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