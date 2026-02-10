import { Router } from 'express'
import { frequenciaController } from '../controllers/frequenciaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import {
  registrarChamadaSchema,
  listarFrequenciaSchema // Verifique se exportou estes no arquivo de schemas
} from '../schemas/frequenciaSchemas'

const router = Router()

// Middlewares obrigatórios para segurança e multi-tenancy
router.use(authMiddleware)
router.use(contextMiddleware)

/**
 * REGISTRO DE CHAMADA
 * Salva ou atualiza a presença dos alunos (Suporta Fund I e II)
 */
router.post(
  '/chamada',
  validate(registrarChamadaSchema),
  frequenciaController.registrarChamada
)

/**
 * CONSULTA DE CHAMADA REALIZADA
 * Retorna a lista de alunos e quem estava presente em um dia específico
 */
router.get(
  '/chamada',
  validate(listarFrequenciaSchema),
  frequenciaController.listarChamadaRealizada
)


export { router as frequenciaRoutes }