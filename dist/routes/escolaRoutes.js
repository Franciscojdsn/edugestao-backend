"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escolaRoutes = void 0;
const express_1 = require("express");
const escolaController_1 = require("../controllers/escolaController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
exports.escolaRoutes = router;
// Autenticação obrigatória
router.use(auth_1.authMiddleware);
// Rotas SEM validação (escola não precisa)
router.get('/', escolaController_1.escolaController.list);
router.get('/:id', escolaController_1.escolaController.show);
//# sourceMappingURL=escolaRoutes.js.map