import { Router } from 'express'
import { portalResponsavelController } from '../controllers/portalResponsavelController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/meus-dados', portalResponsavelController.meusDados)
router.get('/resumo-financeiro', portalResponsavelController.resumoFinanceiro)
router.get('/comunicados', portalResponsavelController.comunicados)
router.get('/historico', portalResponsavelController.historicoAcademico)
router.get('/eventos', portalResponsavelController.eventos)

export { router as portalResponsavelRoutes }