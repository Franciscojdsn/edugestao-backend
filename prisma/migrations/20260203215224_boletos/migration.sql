/*
  Warnings:

  - You are about to drop the column `percentualDesconto` on the `contratos` table. All the data in the column will be lost.
  - You are about to drop the column `professorResponsavel` on the `turmas` table. All the data in the column will be lost.
  - You are about to drop the `pagamentos` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `professorId` to the `turmas_disciplinas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "pagamentos" DROP CONSTRAINT "pagamentos_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "pagamentos" DROP CONSTRAINT "pagamentos_transacaoId_fkey";

-- AlterTable
ALTER TABLE "contratos" DROP COLUMN "percentualDesconto",
ADD COLUMN     "valorDesconto" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "turmas" DROP COLUMN "professorResponsavel";

-- AlterTable
ALTER TABLE "turmas_disciplinas" ADD COLUMN     "professorId" TEXT NOT NULL;

-- DropTable
DROP TABLE "pagamentos";

-- CreateTable
CREATE TABLE "boletos" (
    "id" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "mesReferencia" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "valorBase" DECIMAL(10,2) NOT NULL,
    "valorAtividades" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "valorPago" DECIMAL(10,2),
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "formaPagamento" "FormaPagamento",
    "comprovante" TEXT,
    "observacoes" TEXT,
    "descricao" TEXT,
    "asaasId" TEXT,
    "boletoUrl" TEXT,
    "pixQrCode" TEXT,
    "alunoId" TEXT NOT NULL,
    "transacaoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boletos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "boletos_asaasId_key" ON "boletos"("asaasId");

-- CreateIndex
CREATE UNIQUE INDEX "boletos_transacaoId_key" ON "boletos"("transacaoId");

-- CreateIndex
CREATE INDEX "boletos_alunoId_idx" ON "boletos"("alunoId");

-- CreateIndex
CREATE INDEX "boletos_status_idx" ON "boletos"("status");

-- CreateIndex
CREATE INDEX "boletos_dataVencimento_idx" ON "boletos"("dataVencimento");

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "transacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas_disciplinas" ADD CONSTRAINT "turmas_disciplinas_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
