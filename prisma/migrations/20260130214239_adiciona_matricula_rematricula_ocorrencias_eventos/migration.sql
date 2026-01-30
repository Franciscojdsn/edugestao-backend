-- CreateEnum
CREATE TYPE "StatusMatricula" AS ENUM ('PENDENTE', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'CANCELADA');

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
CREATE TABLE "matriculas" (
    "id" TEXT NOT NULL,
    "numeroMatricula" TEXT NOT NULL,
    "dataMatricula" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anoLetivo" INTEGER NOT NULL,
    "status" "StatusMatricula" NOT NULL DEFAULT 'PENDENTE',
    "etapaAtual" "EtapaMatricula" NOT NULL DEFAULT 'DADOS_PESSOAIS',
    "dadosPessoaisOk" BOOLEAN NOT NULL DEFAULT false,
    "documentosOk" BOOLEAN NOT NULL DEFAULT false,
    "responsaveisOk" BOOLEAN NOT NULL DEFAULT false,
    "contratoAssinado" BOOLEAN NOT NULL DEFAULT false,
    "pagamentoConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "alunoId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
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

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
