import { Router } from 'express'
import { authController } from '../controllers/authController'
import { validate } from '../middlewares/validate'
import { loginSchema } from '../schemas/authSchemas'
import { authMiddleware } from '../middlewares/auth'

const router = Router()

// Agora a rota usa o middleware de validação antes de chegar no controller
router.post('/login', validate(loginSchema), authController.login)
router.post('/logout', authController.logout)
router.get('/me', authMiddleware, authController.me)

export { router as authRoutes }