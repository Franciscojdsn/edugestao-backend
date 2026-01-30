import { Router } from 'express'
import { historicoEscolarController } from '../controllers/historicoEscolarController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import { historicoEscolarSchema } from '../schemas/historicoEscolarSchema'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/alunos/:alunoId', validate(historicoEscolarSchema), historicoEscolarController.gerar)
router.get('/alunos/:alunoId/resumo', historicoEscolarController.resumo)
router.get('/alunos/:alunoId/boletim-completo', historicoEscolarController.boletimCompleto)

export { router as historicoEscolarRoutes }