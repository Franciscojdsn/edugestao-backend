/*
  Warnings:

  - Added the required column `escolaId` to the `boletos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "boletos" ADD COLUMN     "escolaId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
