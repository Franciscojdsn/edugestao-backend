/*
  Warnings:

  - You are about to drop the column `quantidadeParcelas` on the `contratos` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[alunoId,mesReferencia,anoReferencia,escolaId]` on the table `boletos` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `anoFaturamento` to the `contratos` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "boletos_alunoId_escolaId_key";

-- DropIndex
DROP INDEX "matriculas_alunoId_key";

-- AlterTable
ALTER TABLE "contratos" DROP COLUMN "quantidadeParcelas",
ADD COLUMN     "anoFaturamento" SMALLINT NOT NULL,
ADD COLUMN     "mesesFaturamento" INTEGER[];

-- CreateIndex
CREATE UNIQUE INDEX "boletos_alunoId_mesReferencia_anoReferencia_escolaId_key" ON "boletos"("alunoId", "mesReferencia", "anoReferencia", "escolaId");
