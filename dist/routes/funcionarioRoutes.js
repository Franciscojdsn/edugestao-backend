"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.funcionarioRoutes = void 0;
const express_1 = require("express");
const funcionarioController_1 = require("../controllers/funcionarioController");
const auth_1 = require("../middlewares/auth");
const contextMiddleware_1 = require("../middlewares/contextMiddleware");
const validate_1 = require("../middlewares/validate");
const funcionarioSchemas_1 = require("../schemas/funcionarioSchemas");
const router = (0, express_1.Router)();
exports.funcionarioRoutes = router;
// ============================================
// MIDDLEWARES GLOBAIS
// ============================================
router.use(auth_1.authMiddleware);
router.use(contextMiddleware_1.contextMiddleware);
// ============================================
// ROTAS
// ============================================
/**
 * GET /funcionarios
 * Lista funcionários com filtros e paginação
 */
router.get('/', (0, validate_1.validate)(funcionarioSchemas_1.listarFuncionariosSchema), funcionarioController_1.funcionarioController.list);
/**
 * GET /funcionarios/:id
 * Busca funcionário por ID
 */
router.get('/:id', (0, validate_1.validate)(funcionarioSchemas_1.idFuncionarioSchema), funcionarioController_1.funcionarioController.show);
/**
 * POST /funcionarios
 * Cria novo funcionário
 */
router.post('/', (0, validate_1.validate)(funcionarioSchemas_1.criarFuncionarioSchema), funcionarioController_1.funcionarioController.create);
/**
 * POST /funcionarios/:id/pagar-salario
 * Registra pagamento de salário e gera lançamento financeiro
 */
router.post('/:id/pagar-salario', (0, validate_1.validate)(funcionarioSchemas_1.registrarPagamentoSchema), funcionarioController_1.funcionarioController.registrarPagamento);
/**
 * PUT /funcionarios/:id
 * Atualiza funcionário
 */
router.put('/:id', (0, validate_1.validate)(funcionarioSchemas_1.editarFuncionarioSchema), funcionarioController_1.funcionarioController.update);
/**
 * DELETE /funcionarios/:id
 * Soft delete de funcionário
 */
router.delete('/:id', (0, validate_1.validate)(funcionarioSchemas_1.idFuncionarioSchema), funcionarioController_1.funcionarioController.delete);
//# sourceMappingURL=funcionarioRoutes.js.map