"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviarComunicadoMassaSchema = exports.marcarLidoSchema = exports.listarComunicadosSchema = exports.criarComunicadoSchema = void 0;
const zod_1 = require("zod");
exports.criarComunicadoSchema = zod_1.z.object({
    body: zod_1.z.object({
        titulo: zod_1.z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(200),
        mensagem: zod_1.z.string().min(10, 'Mensagem deve ter no mínimo 10 caracteres'),
        tipo: zod_1.z.enum(['GERAL', 'FINANCEIRO', 'PEDAGOGICO', 'EVENTO', 'URGENTE']).default('GERAL'),
        prioridade: zod_1.z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).default('NORMAL'),
        // Destinatários (opcional - se não informar, envia para todos)
        alunoId: zod_1.z.string().uuid().optional(),
        turmaId: zod_1.z.string().uuid().optional(),
        responsavelId: zod_1.z.string().uuid().optional(),
    }),
});
exports.listarComunicadosSchema = zod_1.z.object({
    query: zod_1.z.object({
        tipo: zod_1.z.enum(['GERAL', 'FINANCEIRO', 'PEDAGOGICO', 'EVENTO', 'URGENTE']).optional(),
        prioridade: zod_1.z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
        alunoId: zod_1.z.string().uuid().optional(),
        turmaId: zod_1.z.string().uuid().optional(),
        lido: zod_1.z.string().regex(/^(true|false)$/).transform(val => val === 'true').optional(),
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }).optional(),
});
exports.marcarLidoSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
exports.enviarComunicadoMassaSchema = zod_1.z.object({
    body: zod_1.z.object({
        titulo: zod_1.z.string().min(3).max(200),
        mensagem: zod_1.z.string().min(10),
        tipo: zod_1.z.enum(['GERAL', 'FINANCEIRO', 'PEDAGOGICO', 'EVENTO', 'URGENTE']),
        prioridade: zod_1.z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).default('NORMAL'),
        destinatarios: zod_1.z.enum(['TODOS', 'TURMA', 'INADIMPLENTES']),
        turmaId: zod_1.z.string().uuid().optional(),
    }),
});
//# sourceMappingURL=comunicadoSchemas.js.map