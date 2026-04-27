import { z } from 'zod'

// ============================================
// SCHEMAS DE VALIDAÇÃO - ALUNO
// ============================================

/**
 * Schema para criar aluno (VERSÃO SIMPLES - sem responsáveis)
 */
const normalizeNumbers = (val: string) => val.replace(/\D/g, '');

export const criarAlunoSchema = z.object({
  body: z.object({
    nome: z.string().min(3, "Nome muito curto").max(100, "Nome excede 100 caracteres").trim(),
    
    // Normaliza para apenas números e barra se passar de 11
    cpf: z.string()
      .transform(normalizeNumbers)
      .refine(val => val.length === 11 || val === '', "CPF deve ter 11 dígitos")
      .optional().nullable(),
      
    dataNascimento: z.coerce.date()
      .refine(date => date <= new Date(), "Data de nascimento não pode ser no futuro")
      .optional(),
    
    naturalidade: z.string().max(50).trim().optional().nullable(),
    genero: z.string().max(20).trim().optional().nullable(),
    
    // Limite exato do BD (VarChar 7)
    numeroMatricula: z.string().min(1, "Matrícula obrigatória").max(7, "Matrícula não pode exceder 7 caracteres").trim(),
    
    // Campos de Saúde
    numeroSus: z.string().transform(normalizeNumbers).refine(v => v.length === 15 || v === '', "Cartão SUS deve ter 15 dígitos").optional().nullable(),
    planoSaude: z.boolean().default(false),
    hospital: z.string().max(50, "Nome do hospital muito longo").trim().optional().nullable(),
    alergias: z.string().max(100, "Descrição de alergias muito longa").trim().optional().nullable(),
    
    // Relacionamentos
    turmaId: z.string().uuid("ID da turma inválido").optional().nullable(),
    enderecoId: z.string().uuid("ID do endereço inválido").optional().nullable(),
  })
});

// Para atualização, todos os campos tornam-se opcionais, mas mantêm as mesmas regras de limite
export const atualizarAlunoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: criarAlunoSchema.shape.body.partial()
});

export const listarAlunosSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1)).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
    turmaId: z.string().uuid().optional(),
    busca: z.string().max(100).optional(),
    status: z.enum(['ATIVO', 'INATIVO', 'TODOS']).optional()
  })
});

/**
 * Schema para buscar por ID (usado em GET, PUT, DELETE)
 */
export const idAlunoSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
})
