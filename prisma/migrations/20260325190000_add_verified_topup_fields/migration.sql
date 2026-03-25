ALTER TABLE "Transaction" ADD COLUMN "onchainTxHash" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "verifiedAt" DATETIME;
CREATE UNIQUE INDEX "Transaction_onchainTxHash_key" ON "Transaction"("onchainTxHash");
