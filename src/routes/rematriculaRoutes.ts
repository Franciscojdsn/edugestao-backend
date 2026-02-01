import { Router } from 'express'
import { rematriculaController } from '../controllers/rematriculaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  gerarRematriculasMassaSchema,
  confirmarRematriculaSchema,
  recusarRematriculaSchema,
  listarRematriculasSchema,
} from '../schemas/rematriculaSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.post('/gerar-massa', validate(gerarRematriculasMassaSchema), rematriculaController.gerarMassa)
router.post('/:id/confirmar', validate(confirmarRematriculaSchema), rematriculaController.confirmar)
router.post('/:id/recusar', validate(recusarRematriculaSchema), rematriculaController.recusar)
router.get('/', validate(listarRematriculasSchema), rematriculaController.list)
router.get('/estatisticas', rematriculaController.estatisticas)
router.get('/:id', rematriculaController.show)

export { router as rematriculaRoutes }