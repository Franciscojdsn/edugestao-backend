"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.criarUsuarioSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
// Schema para login
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email inválido'),
        senha: zod_1.z.string().min(1, 'Senha é obrigatória'),
    }),
});
// Schema para criar usuário
exports.criarUsuarioSchema = zod_1.z.object({
    body: zod_1.z.object({
        nome: zod_1.z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
        email: zod_1.z.string().email('Email inválido'),
        senha: zod_1.z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
        role: zod_1.z.enum(['ADMIN', 'SECRETARIA', 'PROFESSOR', 'FINANCEIRO']).optional(),
    }),
});
//# sourceMappingURL=authSchemas.js.map