import { Router } from 'express'
import { funcionarioController } from '../controllers/funcionarioController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  criarFuncionarioSchema,
  listarFuncionariosSchema,
  registrarPagamentoSchema,
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
 * POST /funcionarios/:id/pagar-salario
 * Registra pagamento de salário e gera lançamento financeiro
 */
router.post(
  '/:id/pagar-salario',
  validate(registrarPagamentoSchema),
  funcionarioController.registrarPagamento
)

/**
 * PUT /funcionarios/:id
 * Atualiza funcionário
 */


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
