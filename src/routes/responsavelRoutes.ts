import { Router } from 'express'
import { responsavelController } from '../controllers/responsavelController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  criarResponsavelSchema,
  atualizarResponsavelSchema,
  listarResponsaveisAlunoSchema,
  listarResponsaveisSchema,
  idResponsavelSchema,
} from '../schemas/responsavelSchemas'

const router = Router()

/**
 * MIDDLEWARES GLOBAIS
 */
router.use(authMiddleware)
router.use(contextMiddleware)

/**
 * ROTAS DE RESPONSÁVEIS
 */

/**
 * GET /alunos/:alunoId/responsaveis
 * Lista responsáveis de um aluno específico
 */
router.get(
  '/alunos/:alunoId/responsaveis',
  validate(listarResponsaveisAlunoSchema),
  responsavelController.listarPorAluno
)

/**
 * GET /responsaveis
 * Lista TODOS os responsáveis (admin) com filtros
 */
router.get(
  '/responsaveis',
  validate(listarResponsaveisSchema),
  responsavelController.list
)

/**
 * GET /responsaveis/:id
 * Busca responsável por ID
 */
router.get(
  '/responsaveis/:id',
  validate(idResponsavelSchema),
  responsavelController.show
)

/**
 * POST /responsaveis
 * Cria novo responsável
 */
router.post(
  '/responsaveis',
  validate(criarResponsavelSchema),
  responsavelController.create
)

/**
 * PUT /responsaveis/:id
 * Atualiza responsável
 */
router.put(
  '/responsaveis/:id',
  validate(atualizarResponsavelSchema),
  responsavelController.update
)

/**
 * DELETE /responsaveis/:id
 * Deleta responsável
 */
router.delete(
  '/responsaveis/:id',
  validate(idResponsavelSchema),
  responsavelController.delete
)

export { router as responsavelRoutes }