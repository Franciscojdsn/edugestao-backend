import { Router } from 'express'
import { dashboardController } from '../controllers/dashboardController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import { dashboardFiltroSchema } from '../schemas/dashboardSchemas'

const router = Router()

router.use(authMiddleware)
router.use(contextMiddleware)

// Visão Geral: Faturamento, Total de Alunos e Inadimplência
router.get('/geral', dashboardController.geral)

// Utilitário: Lista quem faz aniversário no mês selecionado
router.get(
    '/aniversariantes',
    validate(dashboardFiltroSchema),
    dashboardController.aniversariantes
)

export { router as dashboardRoutes }