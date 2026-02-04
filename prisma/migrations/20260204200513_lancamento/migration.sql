-- AlterTable
ALTER TABLE "transacoes" ADD COLUMN     "formaPagamento" "FormaPagamento" NOT NULL DEFAULT 'DINHEIRO';

-- CreateTable
CREATE TABLE "lancamentos" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "TipoTransacao" NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataLiquidacao" TIMESTAMP(3),
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "escolaId" TEXT NOT NULL,
    "alunoId" TEXT,
    "funcionarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "lancamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lancamentos_escolaId_idx" ON "lancamentos"("escolaId");

-- CreateIndex
CREATE INDEX "lancamentos_tipo_idx" ON "lancamentos"("tipo");

-- CreateIndex
CREATE INDEX "lancamentos_status_idx" ON "lancamentos"("status");

-- AddForeignKey
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
