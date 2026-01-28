import { Router } from 'express'
import { relatorioController } from '../controllers/relatorioController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/financeiro', relatorioController.financeiro)
router.get('/pedagogico', relatorioController.pedagogico)
router.get('/frequencia', relatorioController.frequencia)
router.get('/exportar/alunos', relatorioController.exportarAlunos)

export { router as relatorioRoutes }