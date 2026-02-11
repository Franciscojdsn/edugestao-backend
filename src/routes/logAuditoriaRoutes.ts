import { Router } from 'express'
import { logAuditoriaController } from '../controllers/logAuditoriaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
    listarLogsSchema,
    estatisticasLogsSchema,
    detalhesLogSchema
} from '../schemas/logAuditoriaSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

// Adicionado o middleware validate em cada rota
router.get('/', validate(listarLogsSchema), logAuditoriaController.list)
router.get('/estatisticas', validate(estatisticasLogsSchema), logAuditoriaController.estatisticas)
router.get('/exportar', validate(listarLogsSchema), logAuditoriaController.exportar)
router.get('/:id', validate(detalhesLogSchema), logAuditoriaController.show)

export { router as logAuditoriaRoutes }