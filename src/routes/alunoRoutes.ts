import { Router } from 'express'
import { alunoController } from '../controllers/alunoController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  criarAlunoSchema,
  atualizarAlunoSchema,
  listarAlunosSchema,
} from '../schemas/alunoSchemas'
import { idParamSchema } from '../schemas/escolaSchemas'

const router = Router()

// 1. Autenticação (todas as rotas)
router.use(authMiddleware)

// 2. Contexto (todas as rotas)
router.use(contextMiddleware)

// Rotas com validação

// GET /alunos - Listar (valida query params)
router.get(
  '/',
  validate(listarAlunosSchema),
  alunoController.list
)

// GET /alunos/:id - Detalhe (valida ID)
router.get(
  '/:id',
  validate(idParamSchema),
  alunoController.show
)

// POST /alunos - Criar (valida body)
router.post(
  '/',
  validate(criarAlunoSchema),
  alunoController.create
)

// PUT /alunos/:id - Atualizar (valida params + body)
router.put(
  '/:id',
  validate(atualizarAlunoSchema),
  alunoController.update
)

// DELETE /alunos/:id - Deletar (valida ID)
router.delete(
  '/:id',
  validate(idParamSchema),
  alunoController.delete
)

export { router as alunoRoutes }
