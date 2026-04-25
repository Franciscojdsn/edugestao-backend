"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notaRoutes = void 0;
const express_1 = require("express");
const notaController_1 = require("../controllers/notaController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const notaSchemas_1 = require("../schemas/notaSchemas");
const router = (0, express_1.Router)();
exports.notaRoutes = router;
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
router.get('/', (0, validate_1.validate)(notaSchemas_1.listarNotasSchema), notaController_1.notaController.list);
router.post('/', (0, validate_1.validate)(notaSchemas_1.criarNotaSchema), notaController_1.notaController.create);
//# sourceMappingURL=notaRoutes.js.map