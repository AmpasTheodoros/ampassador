-- AlterTable: Add new columns (nullable first for safety)
ALTER TABLE "Invoice" ADD COLUMN "leadId" TEXT,
ADD COLUMN "customerEmail" TEXT,
ADD COLUMN "stripeSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_stripeSessionId_key" ON "Invoice"("stripeSessionId") WHERE "stripeSessionId" IS NOT NULL;

-- CreateIndex
CREATE INDEX "Invoice_leadId_idx" ON "Invoice"("leadId");

-- CreateIndex
CREATE INDEX "Invoice_stripeSessionId_idx" ON "Invoice"("stripeSessionId");

