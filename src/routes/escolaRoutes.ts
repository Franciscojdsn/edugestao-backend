import { Router } from 'express'
import { escolaController } from '../controllers/escolaController'
import { authMiddleware } from '../middlewares/auth'

const router = Router()

// Autenticação obrigatória
router.use(authMiddleware)

// Rotas SEM validação (escola não precisa)
router.get('/', escolaController.list)
router.get('/:id', escolaController.show)

export { router as escolaRoutes }