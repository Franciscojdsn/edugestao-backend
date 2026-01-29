import { Router } from 'express'
import { gerarPagamentosController } from '../controllers/gerarPagamentosController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import { gerarPagamentosContratoSchema } from '../schemas/gerarPagamentosSchema'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.post(
  '/contratos/:contratoId/gerar-pagamentos',
  validate(gerarPagamentosContratoSchema),
  gerarPagamentosController.gerarPagamentosContrato
)

router.get(
  '/contratos/:contratoId/pagamentos-pendentes',
  gerarPagamentosController.listarPagamentosPendentes
)

router.post(
  '/pagamentos/cancelar-mes',
  gerarPagamentosController.cancelarPagamentosMes
)

export { router as gerarPagamentosRoutes }