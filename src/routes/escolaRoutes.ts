import { Router } from 'express'
import { escolaController } from '../controllers/escolaController'
import { authMiddleware } from '../middlewares/auth'

const router = Router()

// Todas as rotas protegidas por autenticação
router.use(authMiddleware)

// GET /escolas
router.get('/', escolaController.list)

// GET /escolas/:id
router.get('/:id', escolaController.show)

export { router as escolaRoutes }
