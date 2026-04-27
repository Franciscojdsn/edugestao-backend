import { Router } from 'express'
import { situacaoController } from '../controllers/situacaoController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  listarPagamentosSchema,
  registrarPagamentoSchema,
} from '../schemas/situacaoSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/', validate(listarPagamentosSchema), situacaoController.list)
router.post('/:id/registrar', validate(registrarPagamentoSchema), situacaoController.registrarPagamento)
router.patch('/:id/estornar', situacaoController.estornarPagamento);

export { router as situacaoRoutes }