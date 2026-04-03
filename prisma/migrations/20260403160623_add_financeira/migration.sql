/*
  Warnings:

  - You are about to drop the column `motivoDesconto` on the `contratos` table. All the data in the column will be lost.
  - You are about to drop the column `temDesconto` on the `contratos` table. All the data in the column will be lost.
  - You are about to drop the column `valorDesconto` on the `contratos` table. All the data in the column will be lost.
  - You are about to drop the column `valorMensalidade` on the `contratos` table. All the data in the column will be lost.
  - Added the required column `valorMensalidadeBase` to the `contratos` table without a default value. This is not possible if the table is not empty.
  - Made the column `escolaId` on table `responsaveis` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "TipoResponsavel" ADD VALUE 'TUTOR';

-- AlterTable
ALTER TABLE "contratos" DROP COLUMN "motivoDesconto",
DROP COLUMN "temDesconto",
DROP COLUMN "valorDesconto",
DROP COLUMN "valorMensalidade",
ADD COLUMN     "descontoMatricula" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "descontoMensalidade" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "quantidadeParcelas" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "valorMatricula" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "valorMensalidadeBase" DECIMAL(10,2) NOT NULL,
ALTER COLUMN "dataInicio" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "lancamentos" ADD COLUMN     "responsavelId" TEXT;

-- AlterTable
ALTER TABLE "responsaveis" ALTER COLUMN "escolaId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "contratos_escolaId_idx" ON "contratos"("escolaId");

-- CreateIndex
CREATE INDEX "responsaveis_escolaId_idx" ON "responsaveis"("escolaId");

-- CreateIndex
CREATE INDEX "responsaveis_cpf_idx" ON "responsaveis"("cpf");

-- AddForeignKey
ALTER TABLE "responsaveis" ADD CONSTRAINT "responsaveis_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "responsaveis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
