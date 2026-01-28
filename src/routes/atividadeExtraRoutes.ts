import { Router } from 'express'
import { atividadeExtraController } from '../controllers/atividadeExtraController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  criarAtividadeSchema,
  atualizarAtividadeSchema,
  vincularAlunoAtividadeSchema,
  desvincularAlunoAtividadeSchema,
} from '../schemas/atividadeExtraSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/', atividadeExtraController.list)
router.get('/:id', atividadeExtraController.show)
router.post('/', validate(criarAtividadeSchema), atividadeExtraController.create)
router.put('/:id', validate(atualizarAtividadeSchema), atividadeExtraController.update)
router.delete('/:id', atividadeExtraController.delete)

router.post('/:atividadeId/alunos', validate(vincularAlunoAtividadeSchema), atividadeExtraController.vincularAluno)
router.delete('/:atividadeId/alunos/:alunoId', validate(desvincularAlunoAtividadeSchema), atividadeExtraController.desvincularAluno)
router.get('/:atividadeId/alunos', atividadeExtraController.alunosDaAtividade)

export { router as atividadeExtraRoutes }