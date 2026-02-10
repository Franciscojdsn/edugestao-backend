/*
  Warnings:

  - Added the required column `escolaId` to the `contratos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contratos" ADD COLUMN     "escolaId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
