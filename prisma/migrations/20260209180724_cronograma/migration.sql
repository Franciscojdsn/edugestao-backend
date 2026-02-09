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
CREATE INDEX "cronogramas_provas_turmaId_idx" ON "cronogramas_provas"("turmaId");

-- CreateIndex
CREATE INDEX "cronogramas_provas_escolaId_idx" ON "cronogramas_provas"("escolaId");

-- AddForeignKey
ALTER TABLE "cronogramas_provas" ADD CONSTRAINT "cronogramas_provas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronogramas_provas" ADD CONSTRAINT "cronogramas_provas_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronogramas_provas" ADD CONSTRAINT "cronogramas_provas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
