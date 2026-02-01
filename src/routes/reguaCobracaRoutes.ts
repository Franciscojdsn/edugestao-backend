import { Router } from 'express'
import { reguaCobracaController } from '../controllers/reguaCobracaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import { escalonarPagamentoSchema, resumoPendenciasSchema } from '../schemas/reguaCobracaSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.post('/verificar', reguaCobracaController.verificarPendencias)
router.post('/notificar', reguaCobracaController.gerarNotificacoes)
router.get('/resumo', validate(resumoPendenciasSchema), reguaCobracaController.resumoPendencias)
router.post('/escalonar/:pagamentoId', validate(escalonarPagamentoSchema), reguaCobracaController.escalonarPagamento)

export { router as reguaCobracaRoutes }