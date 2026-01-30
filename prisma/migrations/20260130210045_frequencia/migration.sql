-- CreateEnum
CREATE TYPE "TipoComunicado" AS ENUM ('GERAL', 'FINANCEIRO', 'PEDAGOGICO', 'EVENTO', 'URGENTE');

-- CreateEnum
CREATE TYPE "PrioridadeComunicado" AS ENUM ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE');

-- CreateTable
CREATE TABLE "comunicados" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" "TipoComunicado" NOT NULL DEFAULT 'GERAL',
    "prioridade" "PrioridadeComunicado" NOT NULL DEFAULT 'NORMAL',
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

-- CreateIndex
CREATE INDEX "comunicados_escolaId_idx" ON "comunicados"("escolaId");

-- CreateIndex
CREATE INDEX "comunicados_alunoId_idx" ON "comunicados"("alunoId");

-- CreateIndex
CREATE INDEX "comunicados_turmaId_idx" ON "comunicados"("turmaId");

-- CreateIndex
CREATE INDEX "comunicados_responsavelId_idx" ON "comunicados"("responsavelId");

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "responsaveis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
