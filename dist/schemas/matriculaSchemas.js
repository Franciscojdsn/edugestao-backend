"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atualizarEtapaSchema = exports.listarMatriculasSchema = exports.finalizarMatriculaSchema = exports.adicionarResponsavelSchema = exports.iniciarMatriculaSchema = void 0;
const zod_1 = require("zod");
exports.iniciarMatriculaSchema = zod_1.z.object({
    body: zod_1.z.object({
        turmaId: zod_1.z.string().uuid("O ID da turma deve ser um UUID válido."),
        anoLetivo: zod_1.z.number().int().min(2024),
        // Dados Pessoais do Aluno
        nomeAluno: zod_1.z.string().min(3, "Nome muito curto"),
        cpf: zod_1.z.string().optional().nullable(),
        dataNascimento: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)"),
        genero: zod_1.z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),
        // Novos Campos: Saúde
        numeroSus: zod_1.z.string().optional().nullable(),
        planoSaude: zod_1.z.boolean().default(false),
        hospital: zod_1.z.string().optional().nullable(),
        matriculaPlano: zod_1.z.string().optional().nullable(),
        // Novo Campo: Endereço (Será isolado no DB)
        endereco: zod_1.z.object({
            cep: zod_1.z.string().min(8, "CEP inválido"),
            rua: zod_1.z.string().min(2, "Rua é obrigatória"),
            numero: zod_1.z.string().min(1, "Número é obrigatório"),
            complemento: zod_1.z.string().optional().nullable(),
            bairro: zod_1.z.string().min(2, "Bairro é obrigatório"),
            cidade: zod_1.z.string().min(2, "Cidade é obrigatória"),
            estado: zod_1.z.string().length(2, "Use a sigla do estado (ex: SP)")
        }).optional().nullable() // Opcional nesta etapa, mas recomendado
    }),
});
exports.adicionarResponsavelSchema = zod_1.z.object({
    params: zod_1.z.object({
        matriculaId: zod_1.z.string().uuid("ID de matrícula deve ser um UUID válido."),
    }),
    body: zod_1.z.object({
        nome: zod_1.z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
        cpf: zod_1.z.string().min(11, "CPF inválido."), // Obrigatório para validação de contrato futuro
        rg: zod_1.z.string().optional().nullable(),
        telefone1: zod_1.z.string().min(10, "Telefone principal inválido."),
        telefone2: zod_1.z.string().optional().nullable(),
        email: zod_1.z.string().email("E-mail inválido.").optional().nullable(),
        tipo: zod_1.z.enum(['PAI', 'MAE', 'AVO', 'TUTOR', 'OUTRO']),
        isResponsavelFinanceiro: zod_1.z.boolean(),
        usarEnderecoDoAluno: zod_1.z.boolean().optional(),
        // O endereço só é validado se usarEnderecoDoAluno for false
        endereco: zod_1.z.object({
            cep: zod_1.z.string().min(8).optional().nullable(),
            rua: zod_1.z.string().min(2).optional().nullable(),
            numero: zod_1.z.string().min(1).optional().nullable(),
            bairro: zod_1.z.string().min(2).optional().nullable(),
            cidade: zod_1.z.string().min(2).optional().nullable(),
            estado: zod_1.z.string().length(2).optional().nullable(),
            complemento: zod_1.z.string().optional().nullable(),
        }).optional().nullable()
    }).refine((data) => {
        // Validação condicional: se não usar o do aluno, o endereço próprio deve estar preenchido
        if (!data.usarEnderecoDoAluno) {
            return data.endereco && data.endereco.cep && data.endereco.rua;
        }
        return true;
    }, {
        message: "Endereço é obrigatório caso não resida com o aluno.",
        path: ["endereco"]
    })
});
exports.finalizarMatriculaSchema = zod_1.z.object({
    params: zod_1.z.object({
        matriculaId: zod_1.z.string().uuid("ID da matrícula deve ser um UUID válido."),
    }),
    body: zod_1.z.object({
        valorMatricula: zod_1.z.number().min(0),
        descontoMatricula: zod_1.z.number().min(0),
        valorMensalidadeBase: zod_1.z.number().positive("A mensalidade base deve ser maior que zero."),
        descontoMensalidade: zod_1.z.number().min(0),
        atividadesExtrasIds: zod_1.z.array(zod_1.z.string().uuid()).optional().default([]), // Nosso carrinho
        diaVencimento: zod_1.z.number().int().min(1).max(31),
        qtdParcelas: zod_1.z.number().int().min(1).max(12, "O máximo de parcelas por contrato é 12."),
        responsavelFinanceiroId: zod_1.z.string().uuid("Responsável financeiro é obrigatório."),
    }),
});
exports.listarMatriculasSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.enum(['PENDENTE', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'CANCELADA']).optional(),
        anoLetivo: zod_1.z.string().regex(/^\d{4}$/).transform(Number).optional(),
        turmaId: zod_1.z.string().uuid().optional(),
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }).optional(),
});
exports.atualizarEtapaSchema = zod_1.z.object({
    params: zod_1.z.object({
        matriculaId: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        etapa: zod_1.z.enum(['DADOS_PESSOAIS', 'DOCUMENTOS', 'RESPONSAVEIS', 'CONTRATO', 'PAGAMENTO', 'FINALIZADA']),
        concluida: zod_1.z.boolean(),
    }),
});
//# sourceMappingURL=matriculaSchemas.js.map