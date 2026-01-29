-- CreateTable
CREATE TABLE "frequencias" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "presente" BOOLEAN NOT NULL DEFAULT true,
    "justificativa" TEXT,
    "alunoId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "disciplinaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frequencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "frequencias_alunoId_idx" ON "frequencias"("alunoId");

-- CreateIndex
CREATE INDEX "frequencias_turmaId_idx" ON "frequencias"("turmaId");

-- CreateIndex
CREATE INDEX "frequencias_data_idx" ON "frequencias"("data");

-- CreateIndex
CREATE UNIQUE INDEX "frequencias_alunoId_turmaId_data_disciplinaId_key" ON "frequencias"("alunoId", "turmaId", "data", "disciplinaId");

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
