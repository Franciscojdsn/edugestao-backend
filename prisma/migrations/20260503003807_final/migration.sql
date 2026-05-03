/*
  Warnings:

  - You are about to drop the column `referencia` on the `boletos` table. All the data in the column will be lost.
  - You are about to alter the column `numeroMatricula` on the `matriculas` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(7)`.
  - You are about to alter the column `anoLetivo` on the `matriculas` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to drop the column `dataNascimento` on the `responsaveis` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[alunoId,escolaId]` on the table `boletos` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[responsavelId]` on the table `matriculas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contratoId]` on the table `matriculas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[numeroMatricula,escolaId]` on the table `matriculas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[alunoId,anoLetivo,escolaId]` on the table `matriculas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cpf,escolaId]` on the table `responsaveis` will be added. If there are existing duplicate values, this will fail.
  - Made the column `cpf` on table `responsaveis` required. This step will fail if there are existing NULL values in that column.
  - Made the column `telefone1` on table `responsaveis` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `responsaveis` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "responsaveis" DROP CONSTRAINT "responsaveis_alunoId_fkey";

-- DropIndex
DROP INDEX "boletos_alunoId_referencia_escolaId_key";

-- DropIndex
DROP INDEX "matriculas_numeroMatricula_key";

-- DropIndex
DROP INDEX "responsaveis_alunoId_idx";

-- DropIndex
DROP INDEX "responsaveis_cpf_alunoId_escolaId_key";

-- AlterTable
ALTER TABLE "alunos" ADD COLUMN     "medicamentos" VARCHAR(500),
ALTER COLUMN "hospital" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "alergias" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "boletos" DROP COLUMN "referencia";

-- AlterTable
ALTER TABLE "matriculas" ADD COLUMN     "responsavelId" TEXT,
ALTER COLUMN "numeroMatricula" SET DATA TYPE VARCHAR(7),
ALTER COLUMN "dataMatricula" SET DATA TYPE DATE,
ALTER COLUMN "anoLetivo" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "responsaveis" DROP COLUMN "dataNascimento",
ALTER COLUMN "cpf" SET NOT NULL,
ALTER COLUMN "telefone1" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "alunoId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "boletos_alunoId_escolaId_key" ON "boletos"("alunoId", "escolaId");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_responsavelId_key" ON "matriculas"("responsavelId");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_contratoId_key" ON "matriculas"("contratoId");

-- CreateIndex
CREATE INDEX "matriculas_responsavelId_idx" ON "matriculas"("responsavelId");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_numeroMatricula_escolaId_key" ON "matriculas"("numeroMatricula", "escolaId");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_alunoId_anoLetivo_escolaId_key" ON "matriculas"("alunoId", "anoLetivo", "escolaId");

-- CreateIndex
CREATE UNIQUE INDEX "responsaveis_cpf_escolaId_key" ON "responsaveis"("cpf", "escolaId");

-- AddForeignKey
ALTER TABLE "responsaveis" ADD CONSTRAINT "responsaveis_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "responsaveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
