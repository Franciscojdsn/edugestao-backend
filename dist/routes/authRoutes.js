"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validate_1 = require("../middlewares/validate");
const authSchemas_1 = require("../schemas/authSchemas");
const router = (0, express_1.Router)();
exports.authRoutes = router;
// Agora a rota usa o middleware de validação antes de chegar no controller
router.post('/login', (0, validate_1.validate)(authSchemas_1.loginSchema), authController_1.authController.login);
//# sourceMappingURL=authRoutes.js.map