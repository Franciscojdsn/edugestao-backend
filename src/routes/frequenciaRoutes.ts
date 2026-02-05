import { Router } from 'express'
import { frequenciaController } from '../controllers/frequenciaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  registrarChamadaSchema,
} from '../schemas/frequenciaSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.post('/chamada', validate(registrarChamadaSchema), frequenciaController.registrarChamada)

export { router as frequenciaRoutes }