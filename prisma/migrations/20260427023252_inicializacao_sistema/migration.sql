-- CreateEnum
CREATE TYPE "RoleUsuario" AS ENUM ('ADMIN', 'SECRETARIA', 'PROFESSOR', 'RESPONSAVEL');

-- CreateEnum
CREATE TYPE "TipoResponsavel" AS ENUM ('PAI', 'MAE', 'AVO', 'TUTOR', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('ATIVO', 'SUSPENSO', 'CANCELADO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "DiaAula" AS ENUM ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO', 'TODOS');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO', 'BOLETO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "AcaoHistory" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ESTORNO');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MANHA', 'TARDE', 'NOITE', 'INTEGRAL');

-- CreateEnum
CREATE TYPE "CargoFuncionario" AS ENUM ('PROFESSOR', 'COORDENADOR', 'SECRETARIA', 'DIRETOR', 'AUXILIAR', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusFuncionario" AS ENUM ('ATIVO', 'AFASTADO', 'DEMITIDO', 'APOSENTADO');

-- CreateEnum
CREATE TYPE "TipoConta" AS ENUM ('CORRENTE', 'POUPANCA', 'SALARIO', 'PAGAMENTO');

-- CreateEnum
CREATE TYPE "TipoChavePix" AS ENUM ('CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATORIA');

-- CreateEnum
CREATE TYPE "TipoComunicado" AS ENUM ('GERAL', 'FINANCEIRO', 'PEDAGOGICO', 'EVENTO', 'URGENTE');

-- CreateEnum
CREATE TYPE "PrioridadeComunicado" AS ENUM ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "Destinatarios" AS ENUM ('TODOS', 'TURMA', 'INADIMPLENTES');

-- CreateEnum
CREATE TYPE "StatusMatricula" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'APROVADA', 'REJEITADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EtapaMatricula" AS ENUM ('DADOS_PESSOAIS', 'DOCUMENTOS', 'RESPONSAVEIS', 'CONTRATO', 'PAGAMENTO', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "StatusRematricula" AS ENUM ('PENDENTE', 'CONFIRMADA', 'RECUSADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoOcorrencia" AS ENUM ('COMPORTAMENTO', 'FALTA_DISCIPLINAR', 'BULLYING', 'ATRASO', 'UNIFORME', 'MATERIAL', 'OUTROS');

-- CreateEnum
CREATE TYPE "GravidadeOcorrencia" AS ENUM ('LEVE', 'MODERADA', 'GRAVE', 'GRAVISSIMA');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('AULA', 'PROVA', 'REUNIAO', 'FERIADO', 'EVENTO_ESCOLAR', 'RECESSO', 'FERIAS', 'OUTROS');

-- CreateTable
CREATE TABLE "escolas" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "cnpj" VARCHAR(14) NOT NULL,
    "telefone" VARCHAR(15),
    "email" VARCHAR(100),
    "logo" VARCHAR(255),
    "mensalidadePadrao" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "diaVencimento" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escolas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "role" "RoleUsuario" NOT NULL DEFAULT 'SECRETARIA',
    "escolaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos" (
    "id" TEXT NOT NULL,
    "rua" VARCHAR(150) NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "complemento" VARCHAR(100),
    "bairro" VARCHAR(100) NOT NULL,
    "cidade" VARCHAR(100) NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "cep" VARCHAR(8) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "cpf" VARCHAR(11),
    "dataNascimento" DATE,
    "naturalidade" VARCHAR(50),
    "genero" VARCHAR(20),
    "foto" VARCHAR(255),
    "numeroMatricula" VARCHAR(7) NOT NULL,
    "dataMatricula" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroSus" VARCHAR(15),
    "planoSaude" BOOLEAN NOT NULL DEFAULT false,
    "hospital" VARCHAR(50),
    "alergias" VARCHAR(100),
    "escolaId" TEXT NOT NULL,
    "enderecoId" TEXT,
    "turmaId" TEXT,
    "deletedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsaveis" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "cpf" VARCHAR(11),
    "rg" VARCHAR(20),
    "dataNascimento" DATE,
    "telefone1" VARCHAR(15),
    "telefone2" VARCHAR(15),
    "email" VARCHAR(70),
    "tipo" "TipoResponsavel" NOT NULL,
    "isResponsavelFinanceiro" BOOLEAN NOT NULL DEFAULT false,
    "alunoId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "enderecoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "responsaveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "valorMatricula" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descontoMatricula" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorMensalidadeBase" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descontoMensalidade" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "diaVencimento" INTEGER NOT NULL DEFAULT 10,
    "quantidadeParcelas" INTEGER NOT NULL DEFAULT 12,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" DATE,
    "status" "StatusContrato" NOT NULL DEFAULT 'ATIVO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "alunoId" TEXT NOT NULL,
    "responsavelFinanceiroId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atividades_extra" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" VARCHAR(100),
    "valor" DECIMAL(10,2) NOT NULL,
    "diaAula" "DiaAula",
    "horario" VARCHAR(4),
    "capacidadeMaxima" SMALLINT,
    "escolaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atividades_extra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos_atividades_extra" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "atividadeExtraId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alunos_atividades_extra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boletos" (
    "id" TEXT NOT NULL,
    "referencia" VARCHAR(50) NOT NULL,
    "mesReferencia" SMALLINT NOT NULL,
    "anoReferencia" SMALLINT NOT NULL,
    "valorBase" DECIMAL(10,2) NOT NULL,
    "valorAtividades" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "valorPago" DECIMAL(10,2),
    "dataVencimento" DATE NOT NULL,
    "dataPagamento" DATE,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "formaPagamento" "FormaPagamento",
    "comprovante" VARCHAR(500),
    "observacoes" VARCHAR(500),
    "descricao" VARCHAR(255),
    "asaasId" VARCHAR(100),
    "boletoUrl" VARCHAR(500),
    "pixQrCode" TEXT,
    "alunoId" TEXT NOT NULL,
    "transacaoId" TEXT,
    "escolaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "boletos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacoes" (
    "id" TEXT NOT NULL,
    "tipo" "TipoTransacao" NOT NULL,
    "motivo" VARCHAR(100) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" VARCHAR(255),
    "escolaId" TEXT NOT NULL,
    "responsavelId" TEXT,
    "funcionarioId" TEXT,
    "contratoId" TEXT,
    "deletedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formaPagamento" "FormaPagamento" NOT NULL DEFAULT 'DINHEIRO',

    CONSTRAINT "transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "histories" (
    "id" TEXT NOT NULL,
    "tabela" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "acao" "AcaoHistory" NOT NULL,
    "dadosAntes" JSONB,
    "dadosDepois" JSONB,
    "usuarioId" TEXT NOT NULL,
    "transacaoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "turno" "Turno" NOT NULL,
    "anoLetivo" SMALLINT NOT NULL,
    "capacidadeMaxima" INTEGER NOT NULL DEFAULT 30,
    "escolaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" DATE,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcionarios" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "cpf" VARCHAR(11) NOT NULL,
    "rg" VARCHAR(20),
    "dataNascimento" TIMESTAMP(3),
    "telefone" VARCHAR(15),
    "email" VARCHAR(100),
    "foto" VARCHAR(255),
    "cargo" "CargoFuncionario" NOT NULL,
    "dataAdmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataDemissao" TIMESTAMP(3),
    "salarioBase" DECIMAL(10,2) NOT NULL,
    "statusFuncionario" "StatusFuncionario" NOT NULL DEFAULT 'ATIVO',
    "escolaId" TEXT NOT NULL,
    "enderecoId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos_salarios" (
    "id" TEXT NOT NULL,
    "mesReferencia" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "salarioBase" DECIMAL(10,2) NOT NULL,
    "salarioAcrescimos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "salarioDesconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorLiquido" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,
    "dataPagamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formaPagamento" TEXT NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PAGO',
    "funcionarioId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "lancamentoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_salarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dados_bancarios_funcionarios" (
    "id" TEXT NOT NULL,
    "banco" VARCHAR(50),
    "agencia" VARCHAR(10),
    "agenciaDigito" VARCHAR(2),
    "conta" VARCHAR(20),
    "contaDigito" VARCHAR(2),
    "tipoConta" "TipoConta" NOT NULL DEFAULT 'CORRENTE',
    "tipoChavePix" "TipoChavePix",
    "chavePix" VARCHAR(100),
    "funcionarioId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dados_bancarios_funcionarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas_professores" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT true,
    "escolaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turmas_professores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplinas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "cargaHoraria" INTEGER,
    "escolaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas_disciplinas" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turmas_disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas" (
    "id" TEXT NOT NULL,
    "bimestre" INTEGER NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "valor" DECIMAL(4,2) NOT NULL,
    "observacao" TEXT,
    "alunoId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frequencias" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "presente" BOOLEAN NOT NULL DEFAULT true,
    "justificativa" TEXT,
    "alunoId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "disciplinaId" TEXT,
    "escolaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frequencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicados" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" "TipoComunicado" NOT NULL DEFAULT 'GERAL',
    "prioridade" "PrioridadeComunicado" NOT NULL DEFAULT 'NORMAL',
    "destinatarios" TEXT NOT NULL DEFAULT 'TODOS',
    "dataEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "escolaId" TEXT NOT NULL,
    "alunoId" TEXT,
    "turmaId" TEXT,
    "responsavelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comunicados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matriculas" (
    "id" TEXT NOT NULL,
    "numeroMatricula" TEXT NOT NULL,
    "dataMatricula" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anoLetivo" INTEGER NOT NULL,
    "status" "StatusMatricula" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "etapaAtual" "EtapaMatricula" NOT NULL DEFAULT 'DADOS_PESSOAIS',
    "dadosPessoaisOk" BOOLEAN NOT NULL DEFAULT false,
    "documentosOk" BOOLEAN NOT NULL DEFAULT false,
    "responsaveisOk" BOOLEAN NOT NULL DEFAULT false,
    "contratoAssinado" BOOLEAN NOT NULL DEFAULT false,
    "pagamentoConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "alunoId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "contratoId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matriculas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rematriculas" (
    "id" TEXT NOT NULL,
    "anoAnterior" INTEGER NOT NULL,
    "anoNovo" INTEGER NOT NULL,
    "status" "StatusRematricula" NOT NULL DEFAULT 'PENDENTE',
    "turmaAnteriorId" TEXT NOT NULL,
    "turmaNova" TEXT,
    "valorAnterior" DECIMAL(10,2) NOT NULL,
    "valorNovo" DECIMAL(10,2) NOT NULL,
    "alunoId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "dataConfirmacao" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rematriculas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocorrencias" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "TipoOcorrencia" NOT NULL,
    "gravidade" "GravidadeOcorrencia" NOT NULL DEFAULT 'LEVE',
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acaoTomada" TEXT,
    "responsavelAcao" TEXT,
    "paisComunicados" BOOLEAN NOT NULL DEFAULT false,
    "dataComunicacao" TIMESTAMP(3),
    "alunoId" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocorrencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoEvento" NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "horaInicio" TEXT,
    "horaFim" TEXT,
    "diaLetivo" BOOLEAN NOT NULL DEFAULT true,
    "publico" BOOLEAN NOT NULL DEFAULT true,
    "escolaId" TEXT NOT NULL,
    "turmaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "entidade" VARCHAR(100) NOT NULL,
    "entidadeId" VARCHAR(100) NOT NULL,
    "acao" VARCHAR(100) NOT NULL,
    "dadosAntigos" JSON,
    "dadosNovos" JSON,
    "usuarioId" VARCHAR(36),
    "escolaId" TEXT NOT NULL,
    "ip" VARCHAR(45),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lancamentos" (
    "id" TEXT NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "tipo" "TipoTransacao" NOT NULL,
    "categoria" VARCHAR(100) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "dataVencimento" DATE NOT NULL,
    "dataLiquidacao" DATE,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "escolaId" TEXT NOT NULL,
    "alunoId" TEXT,
    "funcionarioId" TEXT,
    "responsavelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "lancamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades_horarias" (
    "id" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horarioInicio" TEXT NOT NULL,
    "horarioFim" TEXT NOT NULL,
    "turmaDisciplinaId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,

    CONSTRAINT "grades_horarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cronogramas_provas" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 1,
    "turmaId" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cronogramas_provas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "escolas_cnpj_key" ON "escolas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_escolaId_idx" ON "usuarios"("escolaId");

-- CreateIndex
CREATE INDEX "enderecos_escolaId_idx" ON "enderecos"("escolaId");

-- CreateIndex
CREATE INDEX "alunos_escolaId_idx" ON "alunos"("escolaId");

-- CreateIndex
CREATE INDEX "alunos_turmaId_idx" ON "alunos"("turmaId");

-- CreateIndex
CREATE INDEX "alunos_deletedAt_idx" ON "alunos"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_cpf_escolaId_key" ON "alunos"("cpf", "escolaId");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_numeroMatricula_escolaId_key" ON "alunos"("numeroMatricula", "escolaId");

-- CreateIndex
CREATE INDEX "responsaveis_alunoId_idx" ON "responsaveis"("alunoId");

-- CreateIndex
CREATE INDEX "responsaveis_escolaId_idx" ON "responsaveis"("escolaId");

-- CreateIndex
CREATE INDEX "responsaveis_cpf_idx" ON "responsaveis"("cpf");

-- CreateIndex
CREATE INDEX "responsaveis_isResponsavelFinanceiro_idx" ON "responsaveis"("isResponsavelFinanceiro");

-- CreateIndex
CREATE UNIQUE INDEX "responsaveis_cpf_alunoId_escolaId_key" ON "responsaveis"("cpf", "alunoId", "escolaId");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_alunoId_key" ON "contratos"("alunoId");

-- CreateIndex
CREATE INDEX "contratos_escolaId_idx" ON "contratos"("escolaId");

-- CreateIndex
CREATE INDEX "contratos_alunoId_idx" ON "contratos"("alunoId");

-- CreateIndex
CREATE INDEX "atividades_extra_escolaId_idx" ON "atividades_extra"("escolaId");

-- CreateIndex
CREATE INDEX "alunos_atividades_extra_alunoId_idx" ON "alunos_atividades_extra"("alunoId");

-- CreateIndex
CREATE INDEX "alunos_atividades_extra_atividadeExtraId_idx" ON "alunos_atividades_extra"("atividadeExtraId");

-- CreateIndex
CREATE INDEX "alunos_atividades_extra_escolaId_idx" ON "alunos_atividades_extra"("escolaId");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_atividades_extra_alunoId_atividadeExtraId_escolaId_key" ON "alunos_atividades_extra"("alunoId", "atividadeExtraId", "escolaId");

-- CreateIndex
CREATE UNIQUE INDEX "boletos_asaasId_key" ON "boletos"("asaasId");

-- CreateIndex
CREATE UNIQUE INDEX "boletos_transacaoId_key" ON "boletos"("transacaoId");

-- CreateIndex
CREATE INDEX "boletos_escolaId_idx" ON "boletos"("escolaId");

-- CreateIndex
CREATE INDEX "boletos_alunoId_idx" ON "boletos"("alunoId");

-- CreateIndex
CREATE INDEX "boletos_status_idx" ON "boletos"("status");

-- CreateIndex
CREATE INDEX "boletos_dataVencimento_idx" ON "boletos"("dataVencimento");

-- CreateIndex
CREATE UNIQUE INDEX "boletos_alunoId_referencia_escolaId_key" ON "boletos"("alunoId", "referencia", "escolaId");

-- CreateIndex
CREATE INDEX "transacoes_escolaId_idx" ON "transacoes"("escolaId");

-- CreateIndex
CREATE INDEX "transacoes_tipo_idx" ON "transacoes"("tipo");

-- CreateIndex
CREATE INDEX "transacoes_data_idx" ON "transacoes"("data");

-- CreateIndex
CREATE INDEX "transacoes_deletedAt_idx" ON "transacoes"("deletedAt");

-- CreateIndex
CREATE INDEX "histories_tabela_registroId_idx" ON "histories"("tabela", "registroId");

-- CreateIndex
CREATE INDEX "histories_usuarioId_idx" ON "histories"("usuarioId");

-- CreateIndex
CREATE INDEX "histories_createdAt_idx" ON "histories"("createdAt");

-- CreateIndex
CREATE INDEX "turmas_escolaId_idx" ON "turmas"("escolaId");

-- CreateIndex
CREATE INDEX "turmas_anoLetivo_idx" ON "turmas"("anoLetivo");

-- CreateIndex
CREATE INDEX "turmas_deletedAt_idx" ON "turmas"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_nome_anoLetivo_turno_escolaId_key" ON "turmas"("nome", "anoLetivo", "turno", "escolaId");

-- CreateIndex
CREATE INDEX "funcionarios_escolaId_idx" ON "funcionarios"("escolaId");

-- CreateIndex
CREATE INDEX "funcionarios_cargo_idx" ON "funcionarios"("cargo");

-- CreateIndex
CREATE INDEX "funcionarios_deletedAt_idx" ON "funcionarios"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "funcionarios_cpf_escolaId_key" ON "funcionarios"("cpf", "escolaId");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_salarios_lancamentoId_key" ON "pagamentos_salarios"("lancamentoId");

-- CreateIndex
CREATE INDEX "pagamentos_salarios_escolaId_idx" ON "pagamentos_salarios"("escolaId");

-- CreateIndex
CREATE INDEX "pagamentos_salarios_funcionarioId_idx" ON "pagamentos_salarios"("funcionarioId");

-- CreateIndex
CREATE INDEX "pagamentos_salarios_mesReferencia_anoReferencia_idx" ON "pagamentos_salarios"("mesReferencia", "anoReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "dados_bancarios_funcionarios_funcionarioId_key" ON "dados_bancarios_funcionarios"("funcionarioId");

-- CreateIndex
CREATE INDEX "dados_bancarios_funcionarios_escolaId_idx" ON "dados_bancarios_funcionarios"("escolaId");

-- CreateIndex
CREATE INDEX "turmas_professores_turmaId_idx" ON "turmas_professores"("turmaId");

-- CreateIndex
CREATE INDEX "turmas_professores_professorId_idx" ON "turmas_professores"("professorId");

-- CreateIndex
CREATE INDEX "turmas_professores_escolaId_idx" ON "turmas_professores"("escolaId");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_professores_turmaId_professorId_escolaId_key" ON "turmas_professores"("turmaId", "professorId", "escolaId");

-- CreateIndex
CREATE INDEX "disciplinas_escolaId_idx" ON "disciplinas"("escolaId");

-- CreateIndex
CREATE INDEX "turmas_disciplinas_turmaId_idx" ON "turmas_disciplinas"("turmaId");

-- CreateIndex
CREATE INDEX "turmas_disciplinas_disciplinaId_idx" ON "turmas_disciplinas"("disciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_disciplinas_turmaId_disciplinaId_key" ON "turmas_disciplinas"("turmaId", "disciplinaId");

-- CreateIndex
CREATE INDEX "notas_alunoId_idx" ON "notas"("alunoId");

-- CreateIndex
CREATE INDEX "notas_turmaId_idx" ON "notas"("turmaId");

-- CreateIndex
CREATE INDEX "notas_disciplinaId_idx" ON "notas"("disciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "notas_alunoId_disciplinaId_bimestre_anoLetivo_key" ON "notas"("alunoId", "disciplinaId", "bimestre", "anoLetivo");

-- CreateIndex
CREATE INDEX "frequencias_alunoId_idx" ON "frequencias"("alunoId");

-- CreateIndex
CREATE INDEX "frequencias_turmaId_idx" ON "frequencias"("turmaId");

-- CreateIndex
CREATE INDEX "frequencias_escolaId_idx" ON "frequencias"("escolaId");

-- CreateIndex
CREATE INDEX "frequencias_data_idx" ON "frequencias"("data");

-- CreateIndex
CREATE UNIQUE INDEX "frequencias_alunoId_turmaId_data_disciplinaId_key" ON "frequencias"("alunoId", "turmaId", "data", "disciplinaId");

-- CreateIndex
CREATE INDEX "comunicados_escolaId_idx" ON "comunicados"("escolaId");

-- CreateIndex
CREATE INDEX "comunicados_alunoId_idx" ON "comunicados"("alunoId");

-- CreateIndex
CREATE INDEX "comunicados_turmaId_idx" ON "comunicados"("turmaId");

-- CreateIndex
CREATE INDEX "comunicados_responsavelId_idx" ON "comunicados"("responsavelId");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_numeroMatricula_key" ON "matriculas"("numeroMatricula");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_alunoId_key" ON "matriculas"("alunoId");

-- CreateIndex
CREATE INDEX "matriculas_escolaId_idx" ON "matriculas"("escolaId");

-- CreateIndex
CREATE INDEX "matriculas_status_idx" ON "matriculas"("status");

-- CreateIndex
CREATE INDEX "matriculas_anoLetivo_idx" ON "matriculas"("anoLetivo");

-- CreateIndex
CREATE INDEX "rematriculas_escolaId_idx" ON "rematriculas"("escolaId");

-- CreateIndex
CREATE INDEX "rematriculas_status_idx" ON "rematriculas"("status");

-- CreateIndex
CREATE INDEX "rematriculas_anoNovo_idx" ON "rematriculas"("anoNovo");

-- CreateIndex
CREATE INDEX "ocorrencias_escolaId_idx" ON "ocorrencias"("escolaId");

-- CreateIndex
CREATE INDEX "ocorrencias_alunoId_idx" ON "ocorrencias"("alunoId");

-- CreateIndex
CREATE INDEX "ocorrencias_tipo_idx" ON "ocorrencias"("tipo");

-- CreateIndex
CREATE INDEX "ocorrencias_data_idx" ON "ocorrencias"("data");

-- CreateIndex
CREATE INDEX "eventos_escolaId_idx" ON "eventos"("escolaId");

-- CreateIndex
CREATE INDEX "eventos_dataInicio_idx" ON "eventos"("dataInicio");

-- CreateIndex
CREATE INDEX "eventos_tipo_idx" ON "eventos"("tipo");

-- CreateIndex
CREATE INDEX "logs_auditoria_escolaId_idx" ON "logs_auditoria"("escolaId");

-- CreateIndex
CREATE INDEX "logs_auditoria_entidade_idx" ON "logs_auditoria"("entidade");

-- CreateIndex
CREATE INDEX "logs_auditoria_createdAt_idx" ON "logs_auditoria"("createdAt");

-- CreateIndex
CREATE INDEX "lancamentos_escolaId_idx" ON "lancamentos"("escolaId");

-- CreateIndex
CREATE INDEX "lancamentos_tipo_idx" ON "lancamentos"("tipo");

-- CreateIndex
CREATE INDEX "lancamentos_status_idx" ON "lancamentos"("status");

-- CreateIndex
CREATE INDEX "lancamentos_dataVencimento_idx" ON "lancamentos"("dataVencimento");

-- CreateIndex
CREATE INDEX "grades_horarias_escolaId_idx" ON "grades_horarias"("escolaId");

-- CreateIndex
CREATE INDEX "grades_horarias_turmaDisciplinaId_idx" ON "grades_horarias"("turmaDisciplinaId");

-- CreateIndex
CREATE INDEX "grades_horarias_turmaId_idx" ON "grades_horarias"("turmaId");

-- CreateIndex
CREATE INDEX "cronogramas_provas_turmaId_idx" ON "cronogramas_provas"("turmaId");

-- CreateIndex
CREATE INDEX "cronogramas_provas_escolaId_idx" ON "cronogramas_provas"("escolaId");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_enderecoId_fkey" FOREIGN KEY ("enderecoId") REFERENCES "enderecos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsaveis" ADD CONSTRAINT "responsaveis_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsaveis" ADD CONSTRAINT "responsaveis_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsaveis" ADD CONSTRAINT "responsaveis_enderecoId_fkey" FOREIGN KEY ("enderecoId") REFERENCES "enderecos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_responsavelFinanceiroId_fkey" FOREIGN KEY ("responsavelFinanceiroId") REFERENCES "responsaveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_extra" ADD CONSTRAINT "atividades_extra_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos_atividades_extra" ADD CONSTRAINT "alunos_atividades_extra_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos_atividades_extra" ADD CONSTRAINT "alunos_atividades_extra_atividadeExtraId_fkey" FOREIGN KEY ("atividadeExtraId") REFERENCES "atividades_extra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos_atividades_extra" ADD CONSTRAINT "alunos_atividades_extra_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "transacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "responsaveis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "histories" ADD CONSTRAINT "histories_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "histories" ADD CONSTRAINT "histories_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "transacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_enderecoId_fkey" FOREIGN KEY ("enderecoId") REFERENCES "enderecos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos_salarios" ADD CONSTRAINT "pagamentos_salarios_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos_salarios" ADD CONSTRAINT "pagamentos_salarios_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos_salarios" ADD CONSTRAINT "pagamentos_salarios_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "lancamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dados_bancarios_funcionarios" ADD CONSTRAINT "dados_bancarios_funcionarios_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas_professores" ADD CONSTRAINT "turmas_professores_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas_professores" ADD CONSTRAINT "turmas_professores_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "funcionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas_professores" ADD CONSTRAINT "turmas_professores_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplinas" ADD CONSTRAINT "disciplinas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas_disciplinas" ADD CONSTRAINT "turmas_disciplinas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas_disciplinas" ADD CONSTRAINT "turmas_disciplinas_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas_disciplinas" ADD CONSTRAINT "turmas_disciplinas_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "responsaveis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rematriculas" ADD CONSTRAINT "rematriculas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rematriculas" ADD CONSTRAINT "rematriculas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "responsaveis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades_horarias" ADD CONSTRAINT "grades_horarias_turmaDisciplinaId_fkey" FOREIGN KEY ("turmaDisciplinaId") REFERENCES "turmas_disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades_horarias" ADD CONSTRAINT "grades_horarias_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades_horarias" ADD CONSTRAINT "grades_horarias_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronogramas_provas" ADD CONSTRAINT "cronogramas_provas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronogramas_provas" ADD CONSTRAINT "cronogramas_provas_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronogramas_provas" ADD CONSTRAINT "cronogramas_provas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
