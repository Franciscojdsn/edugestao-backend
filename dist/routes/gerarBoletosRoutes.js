"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerarBoletosRoutes = void 0;
const express_1 = require("express");
const gerarBoletosController_1 = require("../controllers/gerarBoletosController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const gerarBoletosSchema_1 = require("../schemas/gerarBoletosSchema");
const router = (0, express_1.Router)();
exports.gerarBoletosRoutes = router;
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
router.post('/contratos/:contratoId/gerar-boletos', (0, validate_1.validate)(gerarBoletosSchema_1.gerarBoletosContratoSchema), gerarBoletosController_1.gerarBoletosController.gerar);
//# sourceMappingURL=gerarBoletosRoutes.js.map