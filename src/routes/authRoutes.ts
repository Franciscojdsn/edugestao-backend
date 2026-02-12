import { Router } from 'express'
import { authController } from '../controllers/authController'
import { validate } from '../middlewares/validate'
import { loginSchema } from '../schemas/authSchemas'

const router = Router()

// Agora a rota usa o middleware de validação antes de chegar no controller
router.post('/sessions', validate(loginSchema), authController.login)

export { router as authRoutes }