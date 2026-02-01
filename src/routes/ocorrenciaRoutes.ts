import { Router } from 'express'
import { ocorrenciaController } from '../controllers/ocorrenciaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  criarOcorrenciaSchema,
  atualizarOcorrenciaSchema,
  listarOcorrenciasSchema,
} from '../schemas/ocorrenciaSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.post('/', validate(criarOcorrenciaSchema), ocorrenciaController.create)
router.get('/', validate(listarOcorrenciasSchema), ocorrenciaController.list)
router.get('/resumo', ocorrenciaController.resumoEscola)
router.get('/alunos/:alunoId', ocorrenciaController.relatorioAluno)
router.get('/:id', ocorrenciaController.show)
router.put('/:id', validate(atualizarOcorrenciaSchema), ocorrenciaController.update)
router.post('/:id/comunicar-pais', ocorrenciaController.comunicarPais)

export { router as ocorrenciaRoutes }