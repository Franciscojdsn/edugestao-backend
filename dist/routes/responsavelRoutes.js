"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responsavelRoutes = void 0;
const express_1 = require("express");
const responsavelController_1 = require("../controllers/responsavelController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const responsavelSchemas_1 = require("../schemas/responsavelSchemas");
const router = (0, express_1.Router)();
exports.responsavelRoutes = router;
/**
 * MIDDLEWARES GLOBAIS
 */
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
/**
 * ROTAS DE RESPONSÁVEIS
 */
/**
 * GET /alunos/:alunoId/responsaveis
 * Lista responsáveis de um aluno específico
 */
router.get('/alunos/:alunoId/responsaveis', (0, validate_1.validate)(responsavelSchemas_1.listarResponsaveisAlunoSchema), responsavelController_1.responsavelController.listarPorAluno);
/**
 * GET /responsaveis
 * Lista TODOS os responsáveis (admin) com filtros
 */
router.get('/responsaveis', (0, validate_1.validate)(responsavelSchemas_1.listarResponsaveisSchema), responsavelController_1.responsavelController.list);
/**
 * GET /responsaveis/:id
 * Busca responsável por ID
 */
router.get('/responsaveis/:id', (0, validate_1.validate)(responsavelSchemas_1.idResponsavelSchema), responsavelController_1.responsavelController.show);
/**
 * POST /responsaveis
 * Cria novo responsável
 */
router.post('/responsaveis', (0, validate_1.validate)(responsavelSchemas_1.criarResponsavelSchema), responsavelController_1.responsavelController.create);
/**
 * PUT /responsaveis/:id
 * Atualiza responsável
 */
router.put('/responsaveis/:id', (0, validate_1.validate)(responsavelSchemas_1.atualizarResponsavelSchema), responsavelController_1.responsavelController.update);
/**
 * DELETE /responsaveis/:id
 * Deleta responsável
 */
router.delete('/responsaveis/:id', (0, validate_1.validate)(responsavelSchemas_1.idResponsavelSchema), responsavelController_1.responsavelController.delete);
//# sourceMappingURL=responsavelRoutes.js.map