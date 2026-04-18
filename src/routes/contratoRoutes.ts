import { Router } from 'express'
import { contratoController } from '../controllers/contratoController'
import { authMiddleware, checkRole } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  criarContratoSchema,
  atualizarContratoSchema,
  listarContratosSchema,
  suspenderContratoSchema,
} from '../schemas/contratoSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/', validate(listarContratosSchema), contratoController.list)
router.get('/:id', contratoController.show)
router.post('/', validate(criarContratoSchema), contratoController.create)
router.put('/:id', validate(atualizarContratoSchema), contratoController.update)
router.post('/:id/cancelar', contratoController.cancelar)
router.post(
  '/:id/suspender',
  checkRole(['ADMIN', 'SECRETARIA']),
  validate(suspenderContratoSchema),
  contratoController.suspender
)

export { router as contratoRoutes }