-- CreateTable
CREATE TABLE "grades_horarias" (
    "id" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horarioInicio" TEXT NOT NULL,
    "horarioFim" TEXT NOT NULL,
    "turmaDisciplinaId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,

    CONSTRAINT "grades_horarias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grades_horarias_escolaId_idx" ON "grades_horarias"("escolaId");

-- CreateIndex
CREATE INDEX "grades_horarias_turmaDisciplinaId_idx" ON "grades_horarias"("turmaDisciplinaId");

-- AddForeignKey
ALTER TABLE "grades_horarias" ADD CONSTRAINT "grades_horarias_turmaDisciplinaId_fkey" FOREIGN KEY ("turmaDisciplinaId") REFERENCES "turmas_disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades_horarias" ADD CONSTRAINT "grades_horarias_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
