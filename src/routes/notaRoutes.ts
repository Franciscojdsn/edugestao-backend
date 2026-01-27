import { Router } from 'express'
import { notaController } from '../controllers/notaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  criarNotaSchema,
  atualizarNotaSchema,
  listarNotasSchema,
  boletimAlunoSchema,
} from '../schemas/notaSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/', validate(listarNotasSchema), notaController.list)
router.get('/alunos/:alunoId/boletim', validate(boletimAlunoSchema), notaController.boletim)
router.get('/:id', notaController.show)
router.post('/', validate(criarNotaSchema), notaController.create)
router.put('/:id', validate(atualizarNotaSchema), notaController.update)
router.delete('/:id', notaController.delete)

export { router as notaRoutes }