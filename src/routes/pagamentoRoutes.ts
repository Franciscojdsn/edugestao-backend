import { Router } from 'express'
import { pagamentoController } from '../controllers/pagamentoController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  criarPagamentoSchema,
  atualizarPagamentoSchema,
  listarPagamentosSchema,
  registrarPagamentoSchema,
} from '../schemas/pagamentoSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/', validate(listarPagamentosSchema), pagamentoController.list)
router.get('/inadimplentes', pagamentoController.inadimplentes)
router.get('/:id', pagamentoController.show)
router.post('/', validate(criarPagamentoSchema), pagamentoController.create)
router.put('/:id', validate(atualizarPagamentoSchema), pagamentoController.update)
router.post('/:id/registrar', validate(registrarPagamentoSchema), pagamentoController.registrarPagamento)
router.post('/:id/cancelar', pagamentoController.cancelar)

export { router as pagamentoRoutes }