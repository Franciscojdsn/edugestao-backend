"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.frequenciaRoutes = void 0;
const express_1 = require("express");
const frequenciaController_1 = require("../controllers/frequenciaController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const frequenciaSchemas_1 = require("../schemas/frequenciaSchemas");
const router = (0, express_1.Router)();
exports.frequenciaRoutes = router;
// Middlewares obrigatórios para segurança e multi-tenancy
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
/**
 * REGISTRO DE CHAMADA
 * Salva ou atualiza a presença dos alunos (Suporta Fund I e II)
 */
router.post('/chamada', (0, validate_1.validate)(frequenciaSchemas_1.registrarChamadaSchema), frequenciaController_1.frequenciaController.registrarChamada);
/**
 * CONSULTA DE CHAMADA REALIZADA
 * Retorna a lista de alunos e quem estava presente em um dia específico
 */
router.get('/chamada', (0, validate_1.validate)(frequenciaSchemas_1.listarFrequenciaSchema), frequenciaController_1.frequenciaController.listarChamadaRealizada);
//# sourceMappingURL=frequenciaRoutes.js.map