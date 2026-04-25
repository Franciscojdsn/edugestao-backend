"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronogramaProvaRoutes = void 0;
const express_1 = require("express");
const cronogramaProvaController_1 = require("../controllers/cronogramaProvaController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const cronogramaProvaSchemas_1 = require("../schemas/cronogramaProvaSchemas");
const router = (0, express_1.Router)();
exports.cronogramaProvaRoutes = router;
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
// Criar cronograma para uma turma (Ex: Semana de Provas do 1º Trimestre)
router.post('/', (0, validate_1.validate)(cronogramaProvaSchemas_1.criarCronogramaSchema), cronogramaProvaController_1.cronogramaProvaController.create);
// Replicar o cronograma de uma turma para outras (Ex: do 9º A para 9º B e C)
router.post('/copiar', (0, validate_1.validate)(cronogramaProvaSchemas_1.copiarCronogramaSchema), cronogramaProvaController_1.cronogramaProvaController.copiar);
// Visualização para pais e alunos
router.get('/portal/:turmaId', (0, validate_1.validate)(cronogramaProvaSchemas_1.portalResponsavelSchema), cronogramaProvaController_1.cronogramaProvaController.portalResponsavel);
//# sourceMappingURL=cronogramaProvaRoutes.js.map