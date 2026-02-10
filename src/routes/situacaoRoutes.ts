import { Router } from 'express'
import { situacaoController } from '../controllers/situacaoController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  criarPagamentoSchema,
  atualizarPagamentoSchema,
  listarPagamentosSchema,
  registrarPagamentoSchema,
} from '../schemas/situacaoSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/', validate(listarPagamentosSchema), situacaoController.list)
router.get('/inadimplentes', situacaoController.getInadimplentes)
router.get('/:id', situacaoController.show)
router.post('/', validate(criarPagamentoSchema), situacaoController.create)
router.put('/:id', validate(atualizarPagamentoSchema), situacaoController.update)
router.post('/:id/registrar', validate(registrarPagamentoSchema), situacaoController.registrarPagamento)
router.post('/:id/cancelar', situacaoController.cancelar)
router.patch('/:id/estornar', situacaoController.estornarPagamento);

export { router as situacaoRoutes }