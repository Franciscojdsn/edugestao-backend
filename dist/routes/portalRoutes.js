"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portalRoutes = void 0;
const express_1 = require("express");
const portalController_1 = require("../controllers/portalController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const portalSchemas_1 = require("../schemas/portalSchemas");
const router = (0, express_1.Router)();
exports.portalRoutes = router;
// Middlewares Globais da Rota
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
/**
 * GET /portal/dashboard
 * Rota exclusiva para quem tem a role RESPONSAVEL
 */
router.get('/dashboard', (0, auth_1.checkRole)(['RESPONSAVEL']), (0, validate_1.validate)(portalSchemas_1.getPortalDadosSchema), portalController_1.portalController.getDashboard);
//# sourceMappingURL=portalRoutes.js.map