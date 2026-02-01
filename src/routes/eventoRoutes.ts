import { Router } from 'express'
import { eventoController } from '../controllers/eventoController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import { criarEventoSchema, atualizarEventoSchema, listarEventosSchema } from '../schemas/eventoSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.post('/', validate(criarEventoSchema), eventoController.create)
router.get('/', validate(listarEventosSchema), eventoController.list)
router.get('/proximos', eventoController.proximosEventos)
router.get('/calendario/:ano/:mes', eventoController.calendarioMes)
router.get('/:id', eventoController.show)
router.put('/:id', validate(atualizarEventoSchema), eventoController.update)
router.delete('/:id', eventoController.delete)

export { router as eventoRoutes }