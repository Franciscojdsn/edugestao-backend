"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.turmaDisciplinaRoutes = void 0;
const express_1 = require("express");
const turmaDisciplinaController_1 = require("../controllers/turmaDisciplinaController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const turmaDisciplinasSchemas_1 = require("../schemas/turmaDisciplinasSchemas");
const router = (0, express_1.Router)();
exports.turmaDisciplinaRoutes = router;
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
router.post('/turmas/:turmaId/disciplinas', (0, validate_1.validate)(turmaDisciplinasSchemas_1.vincularDisciplinaSchema), turmaDisciplinaController_1.turmaDisciplinaController.vincular);
router.delete('/turmas/:turmaId/disciplinas/:disciplinaId', (0, validate_1.validate)(turmaDisciplinasSchemas_1.desvincularDisciplinaSchema), turmaDisciplinaController_1.turmaDisciplinaController.desvincular);
router.get('/turmas/:turmaId/disciplinas', (0, validate_1.validate)(turmaDisciplinasSchemas_1.listarDisciplinasTurmaSchema), turmaDisciplinaController_1.turmaDisciplinaController.listarDisciplinasDaTurma);
//# sourceMappingURL=turmaDisciplinaRoutes.js.map