import { Router } from 'express'
import { relatorioController } from '../controllers/relatorioController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  relatorioFinanceiroSchema,
  relatorioPedagogicoSchema,
  relatorioFrequenciaSchema,
} from '../schemas/relatorioSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/financeiro', validate(relatorioFinanceiroSchema), relatorioController.financeiro)
router.get('/pedagogico', validate(relatorioPedagogicoSchema), relatorioController.pedagogico)
router.get('/frequencia', validate(relatorioFrequenciaSchema), relatorioController.frequencia)
router.get('/exportar/alunos', relatorioController.exportarAlunos)

export { router as relatorioRoutes }