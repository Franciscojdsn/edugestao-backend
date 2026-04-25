"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disciplinaRoutes = void 0;
const express_1 = require("express");
const disciplinaController_1 = require("../controllers/disciplinaController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const disciplinaSchemas_1 = require("../schemas/disciplinaSchemas");
const router = (0, express_1.Router)();
exports.disciplinaRoutes = router;
/**
 * MIDDLEWARES GLOBAIS
 *
 * Aplicados a TODAS as rotas deste arquivo
 */
// 1. Autenticação - exige token JWT válido
router.use(auth_1.authMiddleware);
// 2. Contexto - armazena escolaId da requisição
router.use(contextMiddleware_1.contextMiddleware);
/**
 * ROTAS DE DISCIPLINAS
 */
/**
 * GET /disciplinas
 * Lista disciplinas com paginação e filtros
 */
router.get('/', (0, validate_1.validate)(disciplinaSchemas_1.listarDisciplinasSchema), disciplinaController_1.disciplinaController.list);
/**
 * GET /disciplinas/:id
 * Busca disciplina por ID
 */
router.get('/:id', (0, validate_1.validate)(disciplinaSchemas_1.idDisciplinaSchema), disciplinaController_1.disciplinaController.show);
/**
 * POST /disciplinas
 * Cria nova disciplina
 */
router.post('/', (0, validate_1.validate)(disciplinaSchemas_1.criarDisciplinaSchema), disciplinaController_1.disciplinaController.create);
/**
 * PUT /disciplinas/:id
 * Atualiza disciplina existente
 */
router.put('/:id', (0, validate_1.validate)(disciplinaSchemas_1.atualizarDisciplinaSchema), disciplinaController_1.disciplinaController.update);
/**
 * DELETE /disciplinas/:id
 * Deleta disciplina
 */
router.delete('/:id', (0, validate_1.validate)(disciplinaSchemas_1.idDisciplinaSchema), disciplinaController_1.disciplinaController.delete);
//# sourceMappingURL=disciplinaRoutes.js.map