"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradeHorariaRoutes = void 0;
const express_1 = require("express");
const gradeHorariaController_1 = require("../controllers/gradeHorariaController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const gradeHorariaSchemas_1 = require("../schemas/gradeHorariaSchemas");
const router = (0, express_1.Router)();
exports.gradeHorariaRoutes = router;
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
// Cadastrar novo horário na grade
router.post('/', (0, validate_1.validate)(gradeHorariaSchemas_1.criarGradeSchema), gradeHorariaController_1.gradeHorariaController.create);
// Listar agenda de um professor logado
router.get('/minha-agenda', gradeHorariaController_1.gradeHorariaController.agendaProfessor);
// Listar aula que está acontecendo agora para o professor
router.get('/aula-atual', gradeHorariaController_1.gradeHorariaController.aulaAtual);
// Listar grade completa de uma turma específica
router.get('/turma/:turmaId', (0, validate_1.validate)(gradeHorariaSchemas_1.listarGradeTurmaSchema), gradeHorariaController_1.gradeHorariaController.listarPorTurma);
//# sourceMappingURL=gradeHorariaRoutes.js.map