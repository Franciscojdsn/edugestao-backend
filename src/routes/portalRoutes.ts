import { Router } from 'express'
import { portalController } from '../controllers/portalController'
import { authMiddleware, checkRole } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import { getPortalDadosSchema } from '../schemas/portalSchemas'

const router = Router()

// Middlewares Globais da Rota
router.use(authMiddleware)
router.use(contextMiddleware)

/**
 * GET /portal/dashboard
 * Rota exclusiva para quem tem a role RESPONSAVEL
 */
router.get(
    '/dashboard',
    checkRole(['RESPONSAVEL']),
    validate(getPortalDadosSchema),
    portalController.getDashboard
)

export { router as portalRoutes }