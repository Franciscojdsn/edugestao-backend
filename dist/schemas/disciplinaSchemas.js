"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idDisciplinaSchema = exports.listarDisciplinasSchema = exports.atualizarDisciplinaSchema = exports.criarDisciplinaSchema = void 0;
const zod_1 = require("zod");
/**
 * SCHEMA: Criar Disciplina
 *
 * Valida os dados necessários para criar uma nova disciplina.
 *
 * Campos obrigatórios:
 * - nome: Nome da disciplina (min 2 caracteres)
 * - cargaHoraria: Horas totais da disciplina (positivo)
 */
exports.criarDisciplinaSchema = zod_1.z.object({
    body: zod_1.z.object({
        nome: zod_1.z.string()
            .min(2, 'Nome deve ter no mínimo 2 caracteres')
            .max(100, 'Nome muito longo'),
        cargaHoraria: zod_1.z.number()
            .int('Carga horária deve ser número inteiro')
            .positive('Carga horária deve ser positiva')
            .min(1, 'Carga horária mínima é 1 hora')
            .max(200, 'Carga horária máxima é 200 horas'),
    }),
});
/**
 * SCHEMA: Atualizar Disciplina
 *
 * Valida os dados para atualização.
 * Todos os campos são opcionais.
 */
exports.atualizarDisciplinaSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID inválido'),
    }),
    body: zod_1.z.object({
        nome: zod_1.z.string()
            .min(2, 'Nome deve ter no mínimo 2 caracteres')
            .max(100, 'Nome muito longo')
            .optional(),
        cargaHoraria: zod_1.z.number()
            .int('Carga horária deve ser número inteiro')
            .positive('Carga horária deve ser positiva')
            .min(1, 'Carga horária mínima é 1 hora')
            .max(200, 'Carga horária máxima é 200 horas')
            .optional(),
    }),
});
/**
 * SCHEMA: Listar Disciplinas
 *
 * Valida parâmetros de paginação e filtros.
 */
exports.listarDisciplinasSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string()
            .regex(/^\d+$/, 'Page deve ser número')
            .transform(Number)
            .optional(),
        limit: zod_1.z.string()
            .regex(/^\d+$/, 'Limit deve ser número')
            .transform(Number)
            .optional(),
        busca: zod_1.z.string()
            .min(1)
            .optional(),
    }).optional(),
});
/**
 * SCHEMA: Buscar por ID
 *
 * Valida UUID do parâmetro :id
 */
exports.idDisciplinaSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('ID inválido'),
    }),
});
//# sourceMappingURL=disciplinaSchemas.js.map