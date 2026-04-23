import { Router } from 'express'
import { lancamentoController } from '../controllers/lancamentoController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { dashboardController } from '../controllers/dashboardController'
import { validate } from '../middlewares/validate'
import {
    criarLancamentoSchema,
    listarLancamentosSchema,
    liquidarLancamentoSchema,
    deletarLancamentoSchema,
    estornarLancamentoSchema
} from '../schemas/lancamentoSchemas'

const router = Router()

router.use(authMiddleware)
router.use(contextMiddleware)

// Listar lançamentos com filtros e paginação
router.get(
    '/lancamentos', 
    validate(listarLancamentosSchema), 
    lancamentoController.list
)

// Criar novo lançamento (ENTRADA ou SAIDA)
router.post(
    '/lancamentos', 
    validate(criarLancamentoSchema), 
    lancamentoController.create
)

// Registrar pagamento/recebimento (Liquidação)
router.patch(
    '/lancamentos/:id/liquidar', 
    validate(liquidarLancamentoSchema), 
    lancamentoController.liquidar
)

// Estornar lançamento (Gera transação compensatória e log)
router.post(
    '/lancamentos/:id/estorno',
    validate(estornarLancamentoSchema),
    lancamentoController.estornar
)

// Excluir lançamento (Soft Delete)
router.delete(
    '/lancamentos/:id',
    validate(deletarLancamentoSchema),
    lancamentoController.delete
)

/**
 * --- DASHBOARD E FLUXO DE CAIXA ---
 */
router.get(
    '/dashboard/resumo', 
    dashboardController.geral
)

export { router as lancamentoRoutes }