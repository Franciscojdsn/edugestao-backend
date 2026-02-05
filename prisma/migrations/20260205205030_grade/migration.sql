/*
  Warnings:

  - Added the required column `turmaId` to the `grades_horarias` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "grades_horarias" ADD COLUMN     "turmaId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "grades_horarias" ADD CONSTRAINT "grades_horarias_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
