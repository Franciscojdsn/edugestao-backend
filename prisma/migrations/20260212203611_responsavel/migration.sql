/*
  Warnings:

  - The values [FINANCEIRO] on the enum `RoleUsuario` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RoleUsuario_new" AS ENUM ('ADMIN', 'SECRETARIA', 'PROFESSOR', 'RESPONSAVEL');
ALTER TABLE "public"."usuarios" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "usuarios" ALTER COLUMN "role" TYPE "RoleUsuario_new" USING ("role"::text::"RoleUsuario_new");
ALTER TYPE "RoleUsuario" RENAME TO "RoleUsuario_old";
ALTER TYPE "RoleUsuario_new" RENAME TO "RoleUsuario";
DROP TYPE "public"."RoleUsuario_old";
ALTER TABLE "usuarios" ALTER COLUMN "role" SET DEFAULT 'SECRETARIA';
COMMIT;
