import { Router } from 'express'
import { ocorrenciaController } from '../controllers/ocorrenciaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  criarOcorrenciaSchema,
} from '../schemas/ocorrenciaSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/estatisticas', ocorrenciaController.estatisticas)
router.post('/', validate(criarOcorrenciaSchema), ocorrenciaController.create)

export { router as ocorrenciaRoutes }