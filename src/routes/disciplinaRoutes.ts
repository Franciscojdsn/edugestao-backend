import { Router } from 'express'
import { disciplinaController } from '../controllers/disciplinaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  criarDisciplinaSchema,
  atualizarDisciplinaSchema,
  listarDisciplinasSchema,
  idDisciplinaSchema,
} from '../schemas/disciplinaSchemas'

const router = Router()

/**
 * MIDDLEWARES GLOBAIS
 * 
 * Aplicados a TODAS as rotas deste arquivo
 */

// 1. Autenticação - exige token JWT válido
router.use(authMiddleware)

// 2. Contexto - armazena escolaId da requisição
router.use(contextMiddleware)

/**
 * ROTAS DE DISCIPLINAS
 */

/**
 * GET /disciplinas
 * Lista disciplinas com paginação e filtros
 */
router.get(
  '/',
  validate(listarDisciplinasSchema),
  disciplinaController.list
)

/**
 * GET /disciplinas/:id
 * Busca disciplina por ID
 */
router.get(
  '/:id',
  validate(idDisciplinaSchema),
  disciplinaController.show
)

/**
 * POST /disciplinas
 * Cria nova disciplina
 */
router.post(
  '/',
  validate(criarDisciplinaSchema),
  disciplinaController.create
)

/**
 * PUT /disciplinas/:id
 * Atualiza disciplina existente
 */
router.put(
  '/:id',
  validate(atualizarDisciplinaSchema),
  disciplinaController.update
)

/**
 * DELETE /disciplinas/:id
 * Deleta disciplina
 */
router.delete(
  '/:id',
  validate(idDisciplinaSchema),
  disciplinaController.delete
)

export { router as disciplinaRoutes }