/*
  Warnings:

  - The `status` column on the `contratos` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('ATIVO', 'SUSPENSO', 'CANCELADO', 'FINALIZADO');

-- AlterTable
ALTER TABLE "contratos" DROP COLUMN "status",
ADD COLUMN     "status" "StatusContrato" NOT NULL DEFAULT 'ATIVO';
