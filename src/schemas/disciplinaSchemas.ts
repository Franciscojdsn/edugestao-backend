import { z } from 'zod'

/**
 * SCHEMA: Criar Disciplina
 * 
 * Valida os dados necessários para criar uma nova disciplina.
 * 
 * Campos obrigatórios:
 * - nome: Nome da disciplina (min 2 caracteres)
 * - cargaHoraria: Horas totais da disciplina (positivo)
 */
export const criarDisciplinaSchema = z.object({
  body: z.object({
    nome: z.string()
      .min(2, 'Nome deve ter no mínimo 2 caracteres')
      .max(100, 'Nome muito longo'),
    
    cargaHoraria: z.number()
      .int('Carga horária deve ser número inteiro')
      .positive('Carga horária deve ser positiva')
      .min(1, 'Carga horária mínima é 1 hora')
      .max(200, 'Carga horária máxima é 200 horas'),
  }),
})

/**
 * SCHEMA: Atualizar Disciplina
 * 
 * Valida os dados para atualização.
 * Todos os campos são opcionais.
 */
export const atualizarDisciplinaSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    nome: z.string()
      .min(2, 'Nome deve ter no mínimo 2 caracteres')
      .max(100, 'Nome muito longo')
      .optional(),
    
    cargaHoraria: z.number()
      .int('Carga horária deve ser número inteiro')
      .positive('Carga horária deve ser positiva')
      .min(1, 'Carga horária mínima é 1 hora')
      .max(200, 'Carga horária máxima é 200 horas')
      .optional(),
  }),
})

/**
 * SCHEMA: Listar Disciplinas
 * 
 * Valida parâmetros de paginação e filtros.
 */
export const listarDisciplinasSchema = z.object({
  query: z.object({
    page: z.string()
      .regex(/^\d+$/, 'Page deve ser número')
      .transform(Number)
      .optional(),
    
    limit: z.string()
      .regex(/^\d+$/, 'Limit deve ser número')
      .transform(Number)
      .optional(),
    
    busca: z.string()
      .min(1)
      .optional(),
  }).optional(),
})

/**
 * SCHEMA: Buscar por ID
 * 
 * Valida UUID do parâmetro :id
 */
export const idDisciplinaSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
})