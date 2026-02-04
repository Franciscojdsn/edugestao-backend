import { Router } from 'express'
import { lancamentoController } from '../controllers/lancamentoController'
import { authMiddleware } from '../middlewares/auth'
import { dashboardController } from '../controllers/dashboardController'

const router = Router()

// Proteger todas as rotas financeiras
router.use(authMiddleware)

// --- Lançamentos Avulsos ---
router.post('/lancamentos', lancamentoController.create)      // Criar venda ou despesa
router.get('/lancamentos', lancamentoController.list)        // Listar com filtros
router.patch('/lancamentos/:id/liquidar', lancamentoController.liquidar) // Pagar/Receber

// --- Fluxo de Caixa / Dashboard ---
router.get('/dashboard/resumo', dashboardController.geral)

export default router