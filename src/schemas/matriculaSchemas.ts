import { z } from 'zod'

const normalize = (val: string) => val.replace(/\D/g, '');

export const iniciarMatriculaSchema = z.object({
  body: z.object({
    turmaId: z.string().uuid("Selecione uma turma válida."),
    anoLetivo: z.number().int().min(2026),

    // Dados do Aluno
    nomeAluno: z.string().min(3, "Nome muito curto").max(100, "Nome muito longo").trim(),
    cpf: z.string().transform(normalize).refine(v => v.length === 11 || v === '', "CPF inválido").optional().nullable(),
    dataNascimento: z.coerce.date()
      .refine(date => date <= new Date(), "Data de nascimento não pode ser no futuro")
      .catch(() => new Date()),
    genero: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),

    // Saúde
    numeroSus: z.string().transform(normalize).refine(v => v.length === 15 || v === '', "Cartão SUS deve ter 15 dígitos").optional().nullable(),
    planoSaude: z.boolean().default(false),
    hospital: z.string().max(100, "Nome do hospital muito longo").trim().optional().nullable(),
    alergias: z.string().max(500, "Descrição de alergias muito longa").trim().optional().nullable(),
    medicamentos: z.string().max(500, "Descrição de medicamentos muito longa").trim().optional().nullable(),

    // Endereço (Obrigatório no Passo 1 para localização)
    endereco: z.object({
      cep: z.string().transform(normalize).refine(v => v.length === 8, "CEP inválido"),
      rua: z.string().min(3, "Rua obrigatória").max(150, "Rua muito longa").trim(),
      numero: z.string().min(1, "Número obrigatório").max(20, "Número muito longo").trim(),
      bairro: z.string().min(2, "Bairro obrigatório").max(100, "Bairro muito longo").trim(),
      cidade: z.string().min(2, "Cidade obrigatória").max(100, "Cidade muito longa").trim(),
      uf: z.string().length(2, "Use a sigla (Ex: PE)").transform(v => v.toUpperCase()),
      complemento: z.string().max(100, "Complemento muito longo").trim().optional().nullable()
    })
  })
});

export const adicionarResponsavelSchema = z.object({
  params: z.object({
    matriculaId: z.string().uuid("ID de matrícula inválido."),
  }),
  body: z.object({
    nome: z.string().min(3, "Nome muito curto").max(100, "Nome muito longo").trim(),
    cpf: z.string().transform(normalize).refine(v => v.length === 11, "CPF deve ter 11 dígitos"),
    rg: z.string().min(5, "RG muito curto").max(20, "RG muito longo").trim().optional().nullable(),
    telefone1: z.string().min(10, "Telefone inválido").max(13, "Telefone muito longo").transform(normalize),
    telefone2: z.string().min(10, "Telefone inválido").max(13, "Telefone muito longo").transform(normalize).optional().nullable(),
    email: z.string().email("E-mail inválido").max(100, "E-mail muito longo").toLowerCase().trim(),
    tipo: z.enum(['PAI', 'MAE', 'AVO', 'TUTOR', 'OUTRO']),
    isResponsavelFinanceiro: z.boolean().default(false),
    usarEnderecoDoAluno: z.boolean().default(true),

    endereco: z.object({
      cep: z.string().transform(normalize).refine(v => v.length === 8, "CEP deve ter 8 dígitos").optional().nullable(),
      rua: z.string().min(3, "Rua muito curta").max(150, "Rua muito longa").trim().optional().nullable(),
      numero: z.string().min(1, "Número inválido").max(20, "Número muito longo").trim().optional().nullable(),
      bairro: z.string().min(2, "Bairro muito curto").max(100, "Bairro muito longo").trim().optional().nullable(),
      cidade: z.string().min(2, "Cidade muito curta").max(100, "Cidade muito longa").trim().optional().nullable(),
      estado: z.string().length(2).toUpperCase().optional().nullable(),
      complemento: z.string().max(100, "Complemento muito longo").trim().optional().nullable(),
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
    matriculaId: z.string().uuid("ID da matrícula inválido."),
  }),
  body: z.object({
    // Valores monetários: garantimos que são números positivos
    valorMatricula: z.number().min(0).max(10000),
    descontoMatricula: z.number().min(0).max(1000),
    valorMensalidadeBase: z.number().positive("Mensalidade base deve ser maior que zero.").max(10000),
    descontoMensalidade: z.number().min(0).max(1000),
    
    // Configuração de Parcelas
    atividadesExtrasIds: z.array(z.string().uuid()).optional().default([]),
    diaVencimento: z.number().int().min(1).max(28, "Para segurança de meses curtos, use até dia 28"), 
    qtdParcelas: z.number().int().min(1).max(11),
    
    responsavelFinanceiroId: z.string().uuid("Responsável financeiro é obrigatório."),
  })
});
