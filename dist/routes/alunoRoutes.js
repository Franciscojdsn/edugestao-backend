"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alunoRoutes = void 0;
const express_1 = require("express");
const alunoController_1 = require("../controllers/alunoController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const alunoSchemas_1 = require("../schemas/alunoSchemas");
const router = (0, express_1.Router)();
exports.alunoRoutes = router;
// ============================================
// MIDDLEWARES GLOBAIS
// ============================================
// 1. Autenticação (todas as rotas)
router.use(auth_1.authMiddleware);
// 2. Contexto - injeta escolaId (todas as rotas)
router.use(contextMiddleware_1.contextMiddleware);
// ============================================
// ROTAS
// ============================================
/**
 * GET /alunos
 * Lista alunos com filtros e paginação
 */
router.get('/', (0, validate_1.validate)(alunoSchemas_1.listarAlunosSchema), alunoController_1.alunoController.list);
/**
 * GET /alunos/:id
 * Busca aluno por ID
 */
router.get('/:id', auth_1.authMiddleware, (0, auth_1.checkRole)(['ADMIN', 'SECRETARIA', 'PROFESSOR']), (0, validate_1.validate)(alunoSchemas_1.idAlunoSchema), alunoController_1.alunoController.show);
/**
 * POST /alunos
 * Cria novo aluno
 */
router.post('/', auth_1.authMiddleware, (0, auth_1.checkRole)(['ADMIN', 'SECRETARIA']), (0, validate_1.validate)(alunoSchemas_1.criarAlunoSchema), alunoController_1.alunoController.create);
/**
 * PUT /alunos/:id
 * Atualiza aluno
 */
router.put('/:id', auth_1.authMiddleware, (0, auth_1.checkRole)(['ADMIN', 'SECRETARIA']), (0, validate_1.validate)(alunoSchemas_1.atualizarAlunoSchema), alunoController_1.alunoController.update);
/**
 * DELETE /alunos/:id
 * Soft delete de aluno
 */
router.delete('/:id', auth_1.authMiddleware, (0, auth_1.checkRole)(['ADMIN']), (0, validate_1.validate)(alunoSchemas_1.idAlunoSchema), alunoController_1.alunoController.delete);
//# sourceMappingURL=alunoRoutes.js.map