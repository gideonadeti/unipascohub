-- AlterTable
ALTER TABLE "Pasco" ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Pasco_viewCount_idx" ON "Pasco"("viewCount" DESC);
