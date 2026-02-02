import { Router } from 'express'
import { alunoController } from '../controllers/alunoController'
import { authMiddleware, checkRole } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import { criarAlunoSchema, atualizarAlunoSchema, listarAlunosSchema, idAlunoSchema, } from '../schemas/alunoSchemas'

const router = Router()

// ============================================
// MIDDLEWARES GLOBAIS
// ============================================

// 1. Autenticação (todas as rotas)
router.use(authMiddleware)

// 2. Contexto - injeta escolaId (todas as rotas)
router.use(contextMiddleware)

// ============================================
// ROTAS
// ============================================

/**
 * GET /alunos
 * Lista alunos com filtros e paginação
 */
router.get(
  '/',
  validate(listarAlunosSchema),
  alunoController.list
)

/**
 * GET /alunos/:id
 * Busca aluno por ID
 */
router.get(
  '/:id', authMiddleware, checkRole(['ADMIN', 'SECRETARIA', 'PROFESSOR']), validate(idAlunoSchema), alunoController.show
)

/**
 * POST /alunos
 * Cria novo aluno
 */
router.post(
  '/', authMiddleware, checkRole(['ADMIN', 'SECRETARIA']), validate(criarAlunoSchema), alunoController.create
)

/**
 * PUT /alunos/:id
 * Atualiza aluno
 */
router.put(
  '/:id',
  authMiddleware,
  checkRole(['ADMIN', 'SECRETARIA']),
  validate(atualizarAlunoSchema),
  alunoController.update
)

/**
 * DELETE /alunos/:id
 * Soft delete de aluno
 */
router.delete(
  '/:id', authMiddleware, checkRole(['ADMIN']),
  validate(idAlunoSchema),
  alunoController.delete
)

export { router as alunoRoutes }
