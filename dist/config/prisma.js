"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const context_1 = require("../utils/context");
const logAuditoria_1 = require("../utils/logAuditoria");
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new adapter_pg_1.PrismaPg(pool);
const prismaBase = new client_1.PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});
exports.prisma = prismaBase.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                // 1. Executa a query original primeiro
                const result = await query(args);
                // 2. Define operações auditáveis
                const acoesEscrita = ['create', 'update', 'delete', 'upsert', 'updateMany', 'deleteMany'];
                // Evita loop infinito no próprio log
                if (model === 'LogAuditoria')
                    return result;
                if (acoesEscrita.includes(operation)) {
                    // Pega o contexto
                    const context = context_1.requestContext.getStore();
                    // Tenta achar ID da escola no contexto ou nos dados da query
                    const argsData = args;
                    const escolaId = context?.escolaId || argsData?.data?.escolaId || argsData?.where?.escolaId;
                    // Só audita se tiver escolaId (obrigatório no seu sistema)
                    if (escolaId) {
                        // Prepara IDs
                        let entidadeId = 'SISTEMA/LOTE';
                        if (result && typeof result === 'object' && 'id' in result) {
                            entidadeId = String(result.id);
                        }
                        else if (argsData?.where?.id) {
                            entidadeId = String(argsData.where.id);
                        }
                        // Dispara auditoria em background (sem await)
                        (0, logAuditoria_1.logAction)({
                            entidade: model,
                            entidadeId,
                            acao: operation.toUpperCase(),
                            dadosNovos: argsData?.data || null,
                            dadosAntigos: argsData?.where || null,
                            usuarioId: context?.userId, // Manda o que tiver, o logAction trata se falhar
                            escolaId: escolaId,
                            ip: 'API'
                        });
                    }
                }
                return result;
            }
        }
    }
});
// Encerramento gracioso
process.on('SIGINT', async () => {
    await prismaBase.$disconnect();
    await pool.end();
    process.exit(0);
});
//# sourceMappingURL=prisma.js.map