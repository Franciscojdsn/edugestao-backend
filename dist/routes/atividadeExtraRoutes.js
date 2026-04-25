"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atividadeExtraRoutes = void 0;
const express_1 = require("express");
const atividadeExtraController_1 = require("../controllers/atividadeExtraController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const atividadeExtraSchemas_1 = require("../schemas/atividadeExtraSchemas");
const router = (0, express_1.Router)();
exports.atividadeExtraRoutes = router;
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
// CRUD Atividades
router.get('/', atividadeExtraController_1.atividadeExtraController.list);
router.get('/:id', atividadeExtraController_1.atividadeExtraController.show);
router.post('/', (0, validate_1.validate)(atividadeExtraSchemas_1.criarAtividadeSchema), atividadeExtraController_1.atividadeExtraController.create);
router.put('/:id', (0, validate_1.validate)(atividadeExtraSchemas_1.atualizarAtividadeSchema), atividadeExtraController_1.atividadeExtraController.update);
router.delete('/:id', atividadeExtraController_1.atividadeExtraController.delete);
// Gestão de Alunos (Matrícula na Atividade)
// Atenção aos nomes dos parâmetros aqui (:atividadeId e :alunoId)
router.post('/:atividadeId/alunos', (0, validate_1.validate)(atividadeExtraSchemas_1.vincularAlunoAtividadeSchema), atividadeExtraController_1.atividadeExtraController.vincularAluno);
router.delete('/:atividadeId/alunos/:alunoId', (0, validate_1.validate)(atividadeExtraSchemas_1.desvincularAlunoAtividadeSchema), atividadeExtraController_1.atividadeExtraController.desvincularAluno);
router.get('/:atividadeId/alunos', atividadeExtraController_1.atividadeExtraController.alunosDaAtividade);
//# sourceMappingURL=atividadeExtraRoutes.js.map