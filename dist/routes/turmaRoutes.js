"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.turmaRoutes = void 0;
const express_1 = require("express");
const turmaController_1 = require("../controllers/turmaController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const turmaSchemas_1 = require("../schemas/turmaSchemas");
const router = (0, express_1.Router)();
exports.turmaRoutes = router;
// ============================================
// MIDDLEWARES GLOBAIS
// ============================================
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
// ============================================
// ROTAS
// ============================================
/**
 * GET /turmas
 * Lista turmas com filtros e paginação
 */
router.get('/', (0, validate_1.validate)(turmaSchemas_1.listarTurmasSchema), turmaController_1.turmaController.list);
/**
 * GET /turmas/:id
 * Busca turma por ID
 */
router.get('/:id', (0, validate_1.validate)(turmaSchemas_1.idTurmaSchema), turmaController_1.turmaController.show);
/**
 * POST /turmas
 * Cria nova turma
 */
router.post('/', (0, validate_1.validate)(turmaSchemas_1.criarTurmaSchema), turmaController_1.turmaController.create);
/**
 * PUT /turmas/:id
 * Atualiza turma
 */
router.put('/:id', (0, validate_1.validate)(turmaSchemas_1.atualizarTurmaSchema), turmaController_1.turmaController.update);
/**
 * DELETE /turmas/:id
 * Deleta turma (só se não tiver alunos)
 */
router.delete('/:id', (0, validate_1.validate)(turmaSchemas_1.idTurmaSchema), turmaController_1.turmaController.delete);
//# sourceMappingURL=turmaRoutes.js.map