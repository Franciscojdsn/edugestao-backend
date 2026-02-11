import { Router } from 'express'
import { portalResponsavelController } from '../controllers/portalResponsavelController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import { portalBaseSchema, portalFiltroSchema } from '../schemas/portalResponsavelSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/meus-dados', validate(portalBaseSchema), portalResponsavelController.meusDados)
router.get('/resumo-financeiro', validate(portalFiltroSchema), portalResponsavelController.resumoFinanceiro)
router.get('/comunicados', validate(portalBaseSchema), portalResponsavelController.comunicados)
router.get('/historico', validate(portalFiltroSchema), portalResponsavelController.historicoAcademico)
router.get('/eventos', validate(portalBaseSchema), portalResponsavelController.eventos)

export { router as portalResponsavelRoutes }