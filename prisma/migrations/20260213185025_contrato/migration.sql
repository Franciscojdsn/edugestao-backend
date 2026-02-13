/*
  Warnings:

  - The values [EM_ANALISE] on the enum `StatusMatricula` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StatusMatricula_new" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'APROVADA', 'REJEITADA', 'CANCELADA');
ALTER TABLE "public"."matriculas" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "matriculas" ALTER COLUMN "status" TYPE "StatusMatricula_new" USING ("status"::text::"StatusMatricula_new");
ALTER TYPE "StatusMatricula" RENAME TO "StatusMatricula_old";
ALTER TYPE "StatusMatricula_new" RENAME TO "StatusMatricula";
DROP TYPE "public"."StatusMatricula_old";
ALTER TABLE "matriculas" ALTER COLUMN "status" SET DEFAULT 'PENDENTE';
COMMIT;

-- AlterTable
ALTER TABLE "matriculas" ADD COLUMN     "contratoId" TEXT;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
