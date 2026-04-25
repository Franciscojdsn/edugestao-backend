"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lancamentoRoutes = void 0;
const express_1 = require("express");
const lancamentoController_1 = require("../controllers/lancamentoController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const dashboardController_1 = require("../controllers/dashboardController");
const validate_1 = require("../middlewares/validate");
const lancamentoSchemas_1 = require("../schemas/lancamentoSchemas");
const router = (0, express_1.Router)();
exports.lancamentoRoutes = router;
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
// Listar lançamentos com filtros e paginação
router.get('/lancamentos', (0, validate_1.validate)(lancamentoSchemas_1.listarLancamentosSchema), lancamentoController_1.lancamentoController.list);
// Criar novo lançamento (ENTRADA ou SAIDA)
router.post('/lancamentos', (0, validate_1.validate)(lancamentoSchemas_1.criarLancamentoSchema), lancamentoController_1.lancamentoController.create);
// Registrar pagamento/recebimento (Liquidação)
router.patch('/lancamentos/:id/liquidar', (0, validate_1.validate)(lancamentoSchemas_1.liquidarLancamentoSchema), lancamentoController_1.lancamentoController.liquidar);
// Estornar lançamento (Gera transação compensatória e log)
router.post('/lancamentos/:id/estorno', (0, validate_1.validate)(lancamentoSchemas_1.estornarLancamentoSchema), lancamentoController_1.lancamentoController.estornar);
// Excluir lançamento (Soft Delete)
router.delete('/lancamentos/:id', (0, validate_1.validate)(lancamentoSchemas_1.deletarLancamentoSchema), lancamentoController_1.lancamentoController.delete);
/**
 * --- DASHBOARD E FLUXO DE CAIXA ---
 */
router.get('/dashboard/resumo', dashboardController_1.dashboardController.geral);
//# sourceMappingURL=lancamentoRoutes.js.map