/*
  Warnings:

  - You are about to drop the column `acrescimos` on the `pagamentos_salarios` table. All the data in the column will be lost.
  - You are about to drop the column `descontos` on the `pagamentos_salarios` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pagamentos_salarios" DROP COLUMN "acrescimos",
DROP COLUMN "descontos",
ADD COLUMN     "salarioAcrescimos" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "salarioDesconto" DECIMAL(10,2) NOT NULL DEFAULT 0;
