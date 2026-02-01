-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "dadosAntigos" JSONB,
    "dadosNovos" JSONB,
    "usuarioId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "logs_auditoria_escolaId_idx" ON "logs_auditoria"("escolaId");

-- CreateIndex
CREATE INDEX "logs_auditoria_entidade_idx" ON "logs_auditoria"("entidade");

-- CreateIndex
CREATE INDEX "logs_auditoria_createdAt_idx" ON "logs_auditoria"("createdAt");

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
