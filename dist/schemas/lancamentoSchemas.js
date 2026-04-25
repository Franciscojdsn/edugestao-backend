"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estornarLancamentoSchema = exports.deletarLancamentoSchema = exports.listarLancamentosSchema = exports.liquidarLancamentoSchema = exports.criarLancamentoSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client"); // Importe o Enum do Prisma
exports.criarLancamentoSchema = zod_1.z.object({
    body: zod_1.z.object({
        descricao: zod_1.z.string().min(3, 'Descrição muito curta').max(255),
        // A mágica acontece aqui:
        tipo: zod_1.z.nativeEnum(client_1.TipoTransacao),
        categoria: zod_1.z.string().min(1, 'Categoria é obrigatória'),
        valor: zod_1.z.number().positive('O valor deve ser maior que zero'),
        dataVencimento: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato AAAA-MM-DD'),
        alunoId: zod_1.z.string().uuid().optional().nullable(),
        funcionarioId: zod_1.z.string().uuid().optional().nullable(),
    }),
});
exports.liquidarLancamentoSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID inválido'),
    }),
    body: zod_1.z.object({
        dataPagamento: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        formaPagamento: zod_1.z.string().default('DINHEIRO'),
    }),
});
exports.listarLancamentosSchema = zod_1.z.object({
    query: zod_1.z.object({
        tipo: zod_1.z.nativeEnum(client_1.TipoTransacao).optional(),
        status: zod_1.z.enum(['PENDENTE', 'PAGO', 'CANCELADO']).optional(),
        mes: zod_1.z.string().optional().transform(v => v ? Number(v) : undefined),
        ano: zod_1.z.string().optional().transform(v => v ? Number(v) : undefined),
    }),
});
exports.deletarLancamentoSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID inválido'),
    }),
});
exports.estornarLancamentoSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID inválido'),
    }),
    body: zod_1.z.object({
        motivo: zod_1.z.string().min(5, 'O motivo do estorno deve ter pelo menos 5 caracteres'),
    }),
});
//# sourceMappingURL=lancamentoSchemas.js.map