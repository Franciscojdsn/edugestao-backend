"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historicoEscolarRoutes = void 0;
const express_1 = require("express");
const historicoEscolarController_1 = require("../controllers/historicoEscolarController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const historicoEscolarSchema_1 = require("../schemas/historicoEscolarSchema");
const router = (0, express_1.Router)();
exports.historicoEscolarRoutes = router;
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
// Gera o histórico acadêmico formal (Dados do Aluno + Notas consolidada)
router.get('/alunos/:alunoId', (0, validate_1.validate)(historicoEscolarSchema_1.historicoEscolarSchema), historicoEscolarController_1.historicoEscolarController.gerar);
// Resumo rápido: Turma atual, média geral e total de faltas
router.get('/alunos/:alunoId/resumo', historicoEscolarController_1.historicoEscolarController.resumo);
// Boletim Detalhado: Notas de todos os bimestres organizadas por ano letivo
router.get('/alunos/:alunoId/boletim-completo', historicoEscolarController_1.historicoEscolarController.boletimCompleto);
//# sourceMappingURL=historicoEscolarRoutes.js.map