import { Router } from 'express'
import { funcionarioController } from '../controllers/funcionarioController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  criarFuncionarioSchema,
  atualizarFuncionarioSchema,
  listarFuncionariosSchema,
  idFuncionarioSchema,
} from '../schemas/funcionarioSchemas'

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
 * GET /funcionarios
 * Lista funcionários com filtros e paginação
 */
router.get(
  '/',
  validate(listarFuncionariosSchema),
  funcionarioController.list
)

/**
 * GET /funcionarios/:id
 * Busca funcionário por ID
 */
router.get(
  '/:id',
  validate(idFuncionarioSchema),
  funcionarioController.show
)

/**
 * POST /funcionarios
 * Cria novo funcionário
 */
router.post(
  '/',
  validate(criarFuncionarioSchema),
  funcionarioController.create
)

/**
 * PUT /funcionarios/:id
 * Atualiza funcionário
 */
router.put(
  '/:id',
  validate(atualizarFuncionarioSchema),
  funcionarioController.update
)

/**
 * DELETE /funcionarios/:id
 * Soft delete de funcionário
 */
router.delete(
  '/:id',
  validate(idFuncionarioSchema),
  funcionarioController.delete
)

export { router as funcionarioRoutes }
