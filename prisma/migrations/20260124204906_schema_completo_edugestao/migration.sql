/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RoleUsuario" AS ENUM ('ADMIN', 'SECRETARIA', 'PROFESSOR', 'FINANCEIRO');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL');

-- CreateEnum
CREATE TYPE "TipoResponsavel" AS ENUM ('PAI', 'MAE', 'AVO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "AcaoHistory" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ESTORNO');

-- CreateEnum
CREATE TYPE "CargoFuncionario" AS ENUM ('PROFESSOR', 'COORDENADOR', 'SECRETARIA', 'DIRETOR', 'AUXILIAR', 'OUTRO');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "escolas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "mensalidadePadrao" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "diaVencimento" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escolas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "role" "RoleUsuario" NOT NULL DEFAULT 'SECRETARIA',
    "escolaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos" (
    "id" TEXT NOT NULL,
    "rua" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "cep" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "naturalidade" TEXT,
    "genero" TEXT,
    "foto" TEXT,
    "numeroMatricula" TEXT NOT NULL,
    "dataMatricula" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "turno" "Turno",
    "escolaId" TEXT NOT NULL,
    "enderecoId" TEXT,
    "turmaId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsaveis" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "telefone1" TEXT,
    "telefone2" TEXT,
    "email" TEXT,
    "tipo" "TipoResponsavel" NOT NULL,
    "isResponsavelFinanceiro" BOOLEAN NOT NULL DEFAULT false,
    "alunoId" TEXT NOT NULL,
    "enderecoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "responsaveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "valorMensalidade" DECIMAL(10,2) NOT NULL,
    "diaVencimento" INTEGER NOT NULL DEFAULT 10,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "temDesconto" BOOLEAN NOT NULL DEFAULT false,
    "percentualDesconto" DECIMAL(5,2),
    "motivoDesconto" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "alunoId" TEXT NOT NULL,
    "responsavelFinanceiroId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atividades_extra" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
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
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alunos_atividades_extra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "mesReferencia" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "valorBase" DECIMAL(10,2) NOT NULL,
    "valorAtividades" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "valorPago" DECIMAL(10,2),
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "asaasId" TEXT,
    "boletoUrl" TEXT,
    "pixQrCode" TEXT,
    "alunoId" TEXT NOT NULL,
    "transacaoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacoes" (
    "id" TEXT NOT NULL,
    "tipo" "TipoTransacao" NOT NULL,
    "motivo" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,
    "escolaId" TEXT NOT NULL,
    "responsavelId" TEXT,
    "funcionarioId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "nome" TEXT NOT NULL,
    "turno" "Turno" NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "capacidade" INTEGER NOT NULL DEFAULT 30,
    "escolaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcionarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "telefone" TEXT,
    "email" TEXT,
    "foto" TEXT,
    "cargo" "CargoFuncionario" NOT NULL,
    "dataAdmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataDemissao" TIMESTAMP(3),
    "salario" DECIMAL(10,2) NOT NULL,
    "escolaId" TEXT NOT NULL,
    "enderecoId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas_professores" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT true,
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

-- CreateIndex
CREATE UNIQUE INDEX "escolas_cnpj_key" ON "escolas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_escolaId_idx" ON "usuarios"("escolaId");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_cpf_key" ON "alunos"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_numeroMatricula_key" ON "alunos"("numeroMatricula");

-- CreateIndex
CREATE INDEX "alunos_escolaId_idx" ON "alunos"("escolaId");

-- CreateIndex
CREATE INDEX "alunos_turmaId_idx" ON "alunos"("turmaId");

-- CreateIndex
CREATE INDEX "alunos_deletedAt_idx" ON "alunos"("deletedAt");

-- CreateIndex
CREATE INDEX "responsaveis_alunoId_idx" ON "responsaveis"("alunoId");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_alunoId_key" ON "contratos"("alunoId");

-- CreateIndex
CREATE INDEX "contratos_alunoId_idx" ON "contratos"("alunoId");

-- CreateIndex
CREATE INDEX "atividades_extra_escolaId_idx" ON "atividades_extra"("escolaId");

-- CreateIndex
CREATE INDEX "alunos_atividades_extra_alunoId_idx" ON "alunos_atividades_extra"("alunoId");

-- CreateIndex
CREATE INDEX "alunos_atividades_extra_atividadeExtraId_idx" ON "alunos_atividades_extra"("atividadeExtraId");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_atividades_extra_alunoId_atividadeExtraId_key" ON "alunos_atividades_extra"("alunoId", "atividadeExtraId");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_asaasId_key" ON "pagamentos"("asaasId");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_transacaoId_key" ON "pagamentos"("transacaoId");

-- CreateIndex
CREATE INDEX "pagamentos_alunoId_idx" ON "pagamentos"("alunoId");

-- CreateIndex
CREATE INDEX "pagamentos_status_idx" ON "pagamentos"("status");

-- CreateIndex
CREATE INDEX "pagamentos_dataVencimento_idx" ON "pagamentos"("dataVencimento");

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
CREATE UNIQUE INDEX "funcionarios_cpf_key" ON "funcionarios"("cpf");

-- CreateIndex
CREATE INDEX "funcionarios_escolaId_idx" ON "funcionarios"("escolaId");

-- CreateIndex
CREATE INDEX "funcionarios_cargo_idx" ON "funcionarios"("cargo");

-- CreateIndex
CREATE INDEX "funcionarios_deletedAt_idx" ON "funcionarios"("deletedAt");

-- CreateIndex
CREATE INDEX "turmas_professores_turmaId_idx" ON "turmas_professores"("turmaId");

-- CreateIndex
CREATE INDEX "turmas_professores_professorId_idx" ON "turmas_professores"("professorId");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_professores_turmaId_professorId_key" ON "turmas_professores"("turmaId", "professorId");

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

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_enderecoId_fkey" FOREIGN KEY ("enderecoId") REFERENCES "enderecos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsaveis" ADD CONSTRAINT "responsaveis_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsaveis" ADD CONSTRAINT "responsaveis_enderecoId_fkey" FOREIGN KEY ("enderecoId") REFERENCES "enderecos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_responsavelFinanceiroId_fkey" FOREIGN KEY ("responsavelFinanceiroId") REFERENCES "responsaveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_extra" ADD CONSTRAINT "atividades_extra_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos_atividades_extra" ADD CONSTRAINT "alunos_atividades_extra_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos_atividades_extra" ADD CONSTRAINT "alunos_atividades_extra_atividadeExtraId_fkey" FOREIGN KEY ("atividadeExtraId") REFERENCES "atividades_extra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "transacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "responsaveis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "turmas_professores" ADD CONSTRAINT "turmas_professores_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas_professores" ADD CONSTRAINT "turmas_professores_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "funcionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplinas" ADD CONSTRAINT "disciplinas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas_disciplinas" ADD CONSTRAINT "turmas_disciplinas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas_disciplinas" ADD CONSTRAINT "turmas_disciplinas_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
