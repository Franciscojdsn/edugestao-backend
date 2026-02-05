import { Router } from 'express'
import { notaController } from '../controllers/notaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  criarNotaSchema,
  listarNotasSchema,
} from '../schemas/notaSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/', validate(listarNotasSchema), notaController.list)
router.post('/', validate(criarNotaSchema), notaController.create)

export { router as notaRoutes }