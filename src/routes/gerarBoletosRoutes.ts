import { Router } from 'express'
import { gerarBoletosController } from '../controllers/gerarBoletosController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import { gerarBoletosContratoSchema } from '../schemas/gerarBoletosSchema'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.post(
  '/contratos/:contratoId/gerar-boletos',
  validate(gerarBoletosContratoSchema),
  gerarBoletosController.gerar
)

export { router as gerarBoletosRoutes }