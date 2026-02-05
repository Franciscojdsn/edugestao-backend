/*
  Warnings:

  - Added the required column `escolaId` to the `frequencias` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "frequencias" ADD COLUMN     "escolaId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
