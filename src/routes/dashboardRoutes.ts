import { Router } from 'express'
import { dashboardController } from '../controllers/dashboardController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/geral', dashboardController.geral)
router.get('/turmas', dashboardController.turmas)
router.get('/pedagogico', dashboardController.pedagogico)
router.get('/aniversariantes', dashboardController.aniversariantes)

export { router as dashboardRoutes }