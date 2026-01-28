/*
  Warnings:

  - You are about to drop the column `contrato` on the `pagamentos` table. All the data in the column will be lost.
  - The `formaPagamento` column on the `pagamentos` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DiaAula" AS ENUM ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO', 'BOLETO', 'TRANSFERENCIA');

-- AlterTable
ALTER TABLE "atividades_extra" ADD COLUMN     "capacidadeMaxima" INTEGER,
ADD COLUMN     "diaAula" "DiaAula",
ADD COLUMN     "horario" TEXT;

-- AlterTable
ALTER TABLE "pagamentos" DROP COLUMN "contrato",
ADD COLUMN     "comprovante" TEXT,
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "observacoes" TEXT,
DROP COLUMN "formaPagamento",
ADD COLUMN     "formaPagamento" "FormaPagamento";
