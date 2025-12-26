/*
  Warnings:

  - A unique constraint covering the columns `[stripeSessionId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "extractionError" TEXT,
ADD COLUMN     "extractionStatus" TEXT,
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "textHash" TEXT;

-- CreateTable
CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "text" TEXT,
    "embedding" JSONB NOT NULL,
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "charStart" INTEGER,
    "charEnd" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentChunk_documentId_idx" ON "DocumentChunk"("documentId");

-- CreateIndex
CREATE INDEX "DocumentChunk_documentId_chunkIndex_idx" ON "DocumentChunk"("documentId", "chunkIndex");

-- CreateIndex
CREATE INDEX "DocumentChunk_documentId_pageStart_idx" ON "DocumentChunk"("documentId", "pageStart");

-- CreateIndex
CREATE INDEX "Document_textHash_idx" ON "Document"("textHash");

-- Note: Invoice_stripeSessionId_key unique index already exists from previous migration
-- Skipping duplicate creation

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
