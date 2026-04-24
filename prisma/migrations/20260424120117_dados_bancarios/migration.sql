/*
  Warnings:

  - You are about to drop the column `salario` on the `funcionarios` table. All the data in the column will be lost.
  - Added the required column `salarioBase` to the `funcionarios` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusFuncionario" AS ENUM ('ATIVO', 'AFASTADO', 'DEMITIDO', 'APOSENTADO');

-- CreateEnum
CREATE TYPE "TipoConta" AS ENUM ('CORRENTE', 'POUPANCA', 'SALARIO', 'PAGAMENTO');

-- CreateEnum
CREATE TYPE "TipoChavePix" AS ENUM ('CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATORIA');

-- AlterTable
ALTER TABLE "contratos" ALTER COLUMN "valorMensalidadeBase" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "funcionarios" DROP COLUMN "salario",
ADD COLUMN     "salarioBase" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "statusFuncionario" "StatusFuncionario" NOT NULL DEFAULT 'ATIVO';

-- CreateTable
CREATE TABLE "pagamentos_salarios" (
    "id" TEXT NOT NULL,
    "mesReferencia" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "salarioBase" DECIMAL(10,2) NOT NULL,
    "acrescimos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descontos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorLiquido" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,
    "dataPagamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formaPagamento" TEXT NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PAGO',
    "funcionarioId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "lancamentoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_salarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dados_bancarios_funcionarios" (
    "id" TEXT NOT NULL,
    "banco" TEXT,
    "agencia" TEXT,
    "agenciaDigito" TEXT,
    "conta" TEXT,
    "contaDigito" TEXT,
    "tipoConta" "TipoConta" NOT NULL DEFAULT 'CORRENTE',
    "tipoChavePix" "TipoChavePix",
    "chavePix" TEXT,
    "funcionarioId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dados_bancarios_funcionarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_salarios_lancamentoId_key" ON "pagamentos_salarios"("lancamentoId");

-- CreateIndex
CREATE INDEX "pagamentos_salarios_escolaId_idx" ON "pagamentos_salarios"("escolaId");

-- CreateIndex
CREATE INDEX "pagamentos_salarios_funcionarioId_idx" ON "pagamentos_salarios"("funcionarioId");

-- CreateIndex
CREATE INDEX "pagamentos_salarios_mesReferencia_anoReferencia_idx" ON "pagamentos_salarios"("mesReferencia", "anoReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "dados_bancarios_funcionarios_funcionarioId_key" ON "dados_bancarios_funcionarios"("funcionarioId");

-- CreateIndex
CREATE INDEX "dados_bancarios_funcionarios_escolaId_idx" ON "dados_bancarios_funcionarios"("escolaId");

-- AddForeignKey
ALTER TABLE "pagamentos_salarios" ADD CONSTRAINT "pagamentos_salarios_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos_salarios" ADD CONSTRAINT "pagamentos_salarios_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos_salarios" ADD CONSTRAINT "pagamentos_salarios_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "lancamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dados_bancarios_funcionarios" ADD CONSTRAINT "dados_bancarios_funcionarios_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
