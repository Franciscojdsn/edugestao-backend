import { Router } from 'express'
import { logAuditoriaController } from '../controllers/logAuditoriaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/', logAuditoriaController.list)
router.get('/estatisticas', logAuditoriaController.estatisticas)
router.get('/exportar', logAuditoriaController.exportar)
router.get('/:id', logAuditoriaController.show)

export { router as logAuditoriaRoutes }