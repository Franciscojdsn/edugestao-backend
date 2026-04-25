"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditoriaRoutes = void 0;
const express_1 = require("express");
const logAuditoriaController_1 = require("../controllers/logAuditoriaController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const logAuditoriaSchemas_1 = require("../schemas/logAuditoriaSchemas");
const router = (0, express_1.Router)();
exports.logAuditoriaRoutes = router;
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
// Adicionado o middleware validate em cada rota
router.get('/', (0, validate_1.validate)(logAuditoriaSchemas_1.listarLogsSchema), logAuditoriaController_1.logAuditoriaController.list);
router.get('/estatisticas', (0, validate_1.validate)(logAuditoriaSchemas_1.estatisticasLogsSchema), logAuditoriaController_1.logAuditoriaController.estatisticas);
router.get('/exportar', (0, validate_1.validate)(logAuditoriaSchemas_1.listarLogsSchema), logAuditoriaController_1.logAuditoriaController.exportar);
router.get('/:id', (0, validate_1.validate)(logAuditoriaSchemas_1.detalhesLogSchema), logAuditoriaController_1.logAuditoriaController.show);
//# sourceMappingURL=logAuditoriaRoutes.js.map