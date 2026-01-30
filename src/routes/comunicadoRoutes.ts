import { Router } from 'express'
import { comunicadoController } from '../controllers/comunicadoController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  criarComunicadoSchema,
  listarComunicadosSchema,
  marcarLidoSchema,
  enviarComunicadoMassaSchema,
} from '../schemas/comunicadoSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.post('/', validate(criarComunicadoSchema), comunicadoController.create)
router.post('/enviar-massa', validate(enviarComunicadoMassaSchema), comunicadoController.enviarMassa)
router.get('/', validate(listarComunicadosSchema), comunicadoController.list)
router.get('/estatisticas', comunicadoController.estatisticas)
router.get('/alunos/:alunoId', comunicadoController.listarPorAluno)
router.get('/:id', comunicadoController.show)
router.put('/:id/marcar-lido', validate(marcarLidoSchema), comunicadoController.marcarLido)
router.delete('/:id', comunicadoController.delete)

export { router as comunicadoRoutes }