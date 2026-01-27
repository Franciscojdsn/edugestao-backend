import { Router } from 'express'
import { turmaDisciplinaController } from '../controllers/turmaDisciplinaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  vincularDisciplinaSchema,
  desvincularDisciplinaSchema,
  listarDisciplinasTurmaSchema,
} from '../schemas/turmaDisciplinasSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.post(
  '/turmas/:turmaId/disciplinas',
  validate(vincularDisciplinaSchema),
  turmaDisciplinaController.vincular
)

router.delete(
  '/turmas/:turmaId/disciplinas/:disciplinaId',
  validate(desvincularDisciplinaSchema),
  turmaDisciplinaController.desvincular
)

router.get(
  '/turmas/:turmaId/disciplinas',
  validate(listarDisciplinasTurmaSchema),
  turmaDisciplinaController.listarDisciplinasDaTurma
)

export { router as turmaDisciplinaRoutes }