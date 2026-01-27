import { Router } from 'express'
import { contratoController } from '../controllers/contratoController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  criarContratoSchema,
  atualizarContratoSchema,
  listarContratosSchema,
} from '../schemas/contratoSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/', validate(listarContratosSchema), contratoController.list)
router.get('/:id', contratoController.show)
router.post('/', validate(criarContratoSchema), contratoController.create)
router.put('/:id', validate(atualizarContratoSchema), contratoController.update)
router.post('/:id/cancelar', contratoController.cancelar)

export { router as contratoRoutes }