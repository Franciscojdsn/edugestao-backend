import { Router } from 'express'
import { turmaController } from '../controllers/turmaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  criarTurmaSchema,
  atualizarTurmaSchema,
  listarTurmasSchema,
  idTurmaSchema,
} from '../schemas/turmaSchemas'

const router = Router()

// ============================================
// MIDDLEWARES GLOBAIS
// ============================================

router.use(authMiddleware)
router.use(contextMiddleware)

// ============================================
// ROTAS
// ============================================

/**
 * GET /turmas
 * Lista turmas com filtros e paginação
 */
router.get(
  '/',
  validate(listarTurmasSchema),
  turmaController.list
)

/**
 * GET /turmas/:id
 * Busca turma por ID
 */
router.get(
  '/:id',
  validate(idTurmaSchema),
  turmaController.show
)

/**
 * POST /turmas
 * Cria nova turma
 */
router.post(
  '/',
  validate(criarTurmaSchema),
  turmaController.create
)

/**
 * PUT /turmas/:id
 * Atualiza turma
 */
router.put(
  '/:id',
  validate(atualizarTurmaSchema),
  turmaController.update
)

/**
 * DELETE /turmas/:id
 * Deleta turma (só se não tiver alunos)
 */
router.delete(
  '/:id',
  validate(idTurmaSchema),
  turmaController.delete
)

export { router as turmaRoutes }
