import { z } from 'zod'

export const loginSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Email inválido')
      .max(150, 'Email excede 150 caracteres')
      .toLowerCase()
      .trim(),
    senha: z.string()
      .min(1, 'Senha é obrigatória')
      .max(255, 'Senha excede limite de segurança'),
  }),
})

export const criarUsuarioSchema = z.object({
  body: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter no mínimo 3 caracteres')
      .max(100, 'Nome excede limite de 100 caracteres')
      .trim(),
    email: z.string()
      .email('Email inválido')
      .max(150)
      .toLowerCase()
      .trim(),
    senha: z.string()
      .min(6, 'Senha deve ter no mínimo 6 caracteres')
      .max(255, 'Senha excede limite de segurança'),
    // Enum corrigido para espelhar EXATAMENTE o banco de dados
    role: z.enum(['ADMIN', 'SECRETARIA', 'PROFESSOR', 'RESPONSAVEL']).default('SECRETARIA'),
  }),
})

export type LoginInput = z.infer<typeof loginSchema>['body']