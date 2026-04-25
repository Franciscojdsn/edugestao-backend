"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrarPagamentoSchema = exports.listarPagamentosSchema = exports.atualizarPagamentoSchema = exports.criarPagamentoSchema = void 0;
const zod_1 = require("zod");
exports.criarPagamentoSchema = zod_1.z.object({
    body: zod_1.z.object({
        alunoId: zod_1.z.string().uuid('ID de aluno inválido'),
        referencia: zod_1.z.string().min(1, 'Referência é obrigatória'),
        valorTotal: zod_1.z.number().positive('Valor deve ser positivo'),
        dataVencimento: zod_1.z.coerce.date(),
        mesReferencia: zod_1.z.number().min(1).max(12),
        anoReferencia: zod_1.z.number().min(2025),
    }),
});
exports.atualizarPagamentoSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
    body: zod_1.z.object({
        status: zod_1.z.enum(['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']).optional(),
        dataPagamento: zod_1.z.coerce.date(),
        valorPago: zod_1.z.number().positive().optional(),
    }),
});
exports.listarPagamentosSchema = zod_1.z.object({
    query: zod_1.z.object({
        alunoId: zod_1.z.string().uuid().optional(),
        status: zod_1.z.enum(['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']).optional(),
        page: zod_1.z.string().optional().transform(Number).default(1),
        limit: zod_1.z.string().optional().transform(Number).default(20),
    }).optional(),
});
exports.registrarPagamentoSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
    body: zod_1.z.object({
        formaPagamento: zod_1.z.string().optional(),
        observacoes: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=situacaoSchemas.js.map