"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ocorrenciaRoutes = void 0;
const express_1 = require("express");
const ocorrenciaController_1 = require("../controllers/ocorrenciaController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const ocorrenciaSchemas_1 = require("../schemas/ocorrenciaSchemas");
const router = (0, express_1.Router)();
exports.ocorrenciaRoutes = router;
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
router.get('/estatisticas', ocorrenciaController_1.ocorrenciaController.estatisticas);
router.post('/', (0, validate_1.validate)(ocorrenciaSchemas_1.criarOcorrenciaSchema), ocorrenciaController_1.ocorrenciaController.create);
//# sourceMappingURL=ocorrenciaRoutes.js.map