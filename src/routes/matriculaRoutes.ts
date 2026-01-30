import { Router } from 'express'
import { matriculaController } from '../controllers/matriculaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  iniciarMatriculaSchema,
  adicionarResponsavelSchema,
  finalizarMatriculaSchema,
  listarMatriculasSchema,
} from '../schemas/matriculaSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.post('/iniciar', validate(iniciarMatriculaSchema), matriculaController.iniciar)
router.post('/:matriculaId/responsaveis', validate(adicionarResponsavelSchema), matriculaController.adicionarResponsavel)
router.post('/:matriculaId/finalizar', validate(finalizarMatriculaSchema), matriculaController.finalizar)
router.get('/', validate(listarMatriculasSchema), matriculaController.list)
router.get('/:id', matriculaController.show)
router.put('/:id/status', matriculaController.atualizarStatus)
router.delete('/:id', matriculaController.cancelar)

export { router as matriculaRoutes }