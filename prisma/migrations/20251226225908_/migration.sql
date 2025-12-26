/*
  Warnings:

  - A unique constraint covering the columns `[stripeSessionId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- Drop the existing partial unique index if it exists
DROP INDEX IF EXISTS "Invoice_stripeSessionId_key";

-- CreateIndex (full unique index - allows multiple NULLs but enforces uniqueness on non-NULL values)
CREATE UNIQUE INDEX "Invoice_stripeSessionId_key" ON "Invoice"("stripeSessionId");
