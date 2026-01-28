import { Router } from 'express'
import { enderecoController } from '../controllers/enderecoController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import { criarEnderecoSchema, atualizarEnderecoSchema } from '../schemas/enderecoSchemas'

const router = Router()
router.use(authMiddleware)
router.use(contextMiddleware)

router.get('/', enderecoController.list)
router.get('/cep/:cep', enderecoController.buscarPorCep)
router.get('/:id', enderecoController.show)
router.post('/', validate(criarEnderecoSchema), enderecoController.create)
router.put('/:id', validate(atualizarEnderecoSchema), enderecoController.update)
router.delete('/:id', enderecoController.delete)

export { router as enderecoRoutes }