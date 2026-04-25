"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portalResponsavelRoutes = void 0;
const express_1 = require("express");
const portalResponsavelController_1 = require("../controllers/portalResponsavelController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const portalResponsavelSchemas_1 = require("../schemas/portalResponsavelSchemas");
const router = (0, express_1.Router)();
exports.portalResponsavelRoutes = router;
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
router.get('/meus-dados', (0, validate_1.validate)(portalResponsavelSchemas_1.portalBaseSchema), portalResponsavelController_1.portalResponsavelController.meusDados);
router.get('/resumo-financeiro', (0, validate_1.validate)(portalResponsavelSchemas_1.portalFiltroSchema), portalResponsavelController_1.portalResponsavelController.resumoFinanceiro);
router.get('/comunicados', (0, validate_1.validate)(portalResponsavelSchemas_1.portalBaseSchema), portalResponsavelController_1.portalResponsavelController.comunicados);
router.get('/historico', (0, validate_1.validate)(portalResponsavelSchemas_1.portalFiltroSchema), portalResponsavelController_1.portalResponsavelController.historicoAcademico);
router.get('/eventos', (0, validate_1.validate)(portalResponsavelSchemas_1.portalBaseSchema), portalResponsavelController_1.portalResponsavelController.eventos);
//# sourceMappingURL=portalResponsavelRoutes.js.map