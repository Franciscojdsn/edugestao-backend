-- AlterTable
ALTER TABLE "transacoes" ADD COLUMN     "contratoId" TEXT;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
