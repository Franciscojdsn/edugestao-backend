"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relatorioRoutes = void 0;
const express_1 = require("express");
const relatorioController_1 = require("../controllers/relatorioController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const relatorioSchemas_1 = require("../schemas/relatorioSchemas");
const router = (0, express_1.Router)();
exports.relatorioRoutes = router;
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
router.get('/financeiro', (0, validate_1.validate)(relatorioSchemas_1.relatorioFinanceiroSchema), relatorioController_1.relatorioController.financeiro);
router.get('/pedagogico', (0, validate_1.validate)(relatorioSchemas_1.relatorioPedagogicoSchema), relatorioController_1.relatorioController.pedagogico);
router.get('/frequencia', (0, validate_1.validate)(relatorioSchemas_1.relatorioFrequenciaSchema), relatorioController_1.relatorioController.estruturaTurmas);
router.get('/exportar/alunos', relatorioController_1.relatorioController.exportarAlunos);
//# sourceMappingURL=relatorioRoutes.js.map