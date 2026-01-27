/*
  Warnings:

  - Added the required column `escolaId` to the `responsaveis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "responsaveis" ADD COLUMN     "escolaId" TEXT NOT NULL;
