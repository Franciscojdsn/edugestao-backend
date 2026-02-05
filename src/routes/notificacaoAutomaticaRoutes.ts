import { Router } from 'express'
import { notificacaoAutomaticaController } from '../controllers/notificacaoAutomaticaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import { escalonarPagamentoSchema, resumoPendenciasSchema } from '../schemas/notificacaoAutomaticaSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.post('/verificar', notificacaoAutomaticaController.verificarPendencias)
router.post('/notificar', notificacaoAutomaticaController.dispararLembretes)
router.get('/resumo', validate(resumoPendenciasSchema), notificacaoAutomaticaController.resumoPendencias)
router.post('/escalonar/:pagamentoId', validate(escalonarPagamentoSchema), notificacaoAutomaticaController.escalonarPagamento)

export { router as notificacaoAutomaticaRoutes }