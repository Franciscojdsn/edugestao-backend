"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const dashboardSchemas_1 = require("../schemas/dashboardSchemas");
const router = (0, express_1.Router)();
exports.dashboardRoutes = router;
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
// Visão Geral: Faturamento, Total de Alunos e Inadimplência
router.get('/geral', dashboardController_1.dashboardController.geral);
// Visão Financeira/Turmas: Saúde financeira por agrupamento
router.get('/turmas', dashboardController_1.dashboardController.turmas);
// Visão Pedagógica: Médias globais, faltas e ocorrências
router.get('/pedagogico', dashboardController_1.dashboardController.pedagogico);
// Utilitário: Lista quem faz aniversário no mês selecionado
router.get('/aniversariantes', (0, validate_1.validate)(dashboardSchemas_1.dashboardFiltroSchema), dashboardController_1.dashboardController.aniversariantes);
//# sourceMappingURL=dashboardRoutes.js.map