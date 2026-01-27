/*
  Warnings:

  - You are about to drop the column `capacidade` on the `turmas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "turmas" DROP COLUMN "capacidade",
ADD COLUMN     "capacidadeMaxima" INTEGER NOT NULL DEFAULT 30;
