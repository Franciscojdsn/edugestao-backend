import { Router } from 'express'
import { frequenciaController } from '../controllers/frequenciaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  registrarChamadaSchema,
  listarFrequenciaSchema,
  relatorioFrequenciaSchema,
} from '../schemas/frequenciaSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.post('/chamada', validate(registrarChamadaSchema), frequenciaController.registrarChamada)
router.get('/', validate(listarFrequenciaSchema), frequenciaController.list)
router.get('/alunos/:alunoId/relatorio', validate(relatorioFrequenciaSchema), frequenciaController.relatorioAluno)
router.get('/turmas/:turmaId/resumo', frequenciaController.resumoTurma)

export { router as frequenciaRoutes }