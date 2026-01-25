import { z } from 'zod'

// Schema para login
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    senha: z.string().min(1, 'Senha é obrigatória'),
  }),
})

// Schema para criar usuário
export const criarUsuarioSchema = z.object({
  body: z.object({
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('Email inválido'),
    senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    role: z.enum(['ADMIN', 'SECRETARIA', 'PROFESSOR', 'FINANCEIRO']).optional(),
  }),
})
