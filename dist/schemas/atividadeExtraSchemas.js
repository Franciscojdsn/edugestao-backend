"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.desvincularAlunoAtividadeSchema = exports.vincularAlunoAtividadeSchema = exports.atualizarAtividadeSchema = exports.criarAtividadeSchema = void 0;
const zod_1 = require("zod");
exports.criarAtividadeSchema = zod_1.z.object({
    body: zod_1.z.object({
        nome: zod_1.z.string().min(3).max(100),
        descricao: zod_1.z.string().max(500).optional(),
        valor: zod_1.z.number().positive(), // Backend espera number, certifique-se que o frontend envia number
        diaAula: zod_1.z.enum(['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO']),
        horario: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
        capacidadeMaxima: zod_1.z.number().int().positive().optional(),
    }),
});
exports.atualizarAtividadeSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
    body: zod_1.z.object({
        nome: zod_1.z.string().min(3).max(100).optional(),
        descricao: zod_1.z.string().max(500).optional(),
        valor: zod_1.z.number().positive().optional(),
        diaAula: zod_1.z.enum(['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO']).optional(),
        horario: zod_1.z.string().regex(/^\d{2}:\d{2}$/).optional(),
        capacidadeMaxima: zod_1.z.number().int().positive().optional(),
        atualizarBoletosPendentes: zod_1.z.boolean().optional()
    }),
});
exports.vincularAlunoAtividadeSchema = zod_1.z.object({
    params: zod_1.z.object({
        atividadeId: zod_1.z.string().uuid() // Valida o param da URL
    }),
    body: zod_1.z.object({
        alunoId: zod_1.z.string().uuid() // Valida o ID enviado no JSON
    }),
});
exports.desvincularAlunoAtividadeSchema = zod_1.z.object({
    params: zod_1.z.object({
        atividadeId: zod_1.z.string().uuid(),
        alunoId: zod_1.z.string().uuid()
    }),
});
//# sourceMappingURL=atividadeExtraSchemas.js.map