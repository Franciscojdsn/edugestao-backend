"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificacaoAutomaticaRoutes = void 0;
const express_1 = require("express");
const notificacaoAutomaticaController_1 = require("../controllers/notificacaoAutomaticaController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const notificacaoAutomaticaSchemas_1 = require("../schemas/notificacaoAutomaticaSchemas");
const router = (0, express_1.Router)();
exports.notificacaoAutomaticaRoutes = router;
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
router.post('/verificar', notificacaoAutomaticaController_1.notificacaoAutomaticaController.verificarPendencias);
router.post('/notificar', notificacaoAutomaticaController_1.notificacaoAutomaticaController.dispararLembretes);
router.get('/resumo', (0, validate_1.validate)(notificacaoAutomaticaSchemas_1.resumoPendenciasSchema), notificacaoAutomaticaController_1.notificacaoAutomaticaController.resumoPendencias);
router.post('/escalonar/:pagamentoId', (0, validate_1.validate)(notificacaoAutomaticaSchemas_1.escalonarPagamentoSchema), notificacaoAutomaticaController_1.notificacaoAutomaticaController.escalonarPagamento);
//# sourceMappingURL=notificacaoAutomaticaRoutes.js.map