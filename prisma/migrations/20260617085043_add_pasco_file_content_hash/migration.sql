-- AlterTable
ALTER TABLE "PascoFile" ADD COLUMN     "contentHash" TEXT;

-- CreateIndex
CREATE INDEX "PascoFile_contentHash_idx" ON "PascoFile"("contentHash");
