-- CreateEnum
CREATE TYPE "PascoModerationStatus" AS ENUM ('PUBLISHED', 'PENDING_REVIEW', 'REJECTED');

-- AlterTable
ALTER TABLE "Pasco" ADD COLUMN     "moderationStatus" "PascoModerationStatus" NOT NULL DEFAULT 'PUBLISHED';

-- CreateIndex
CREATE INDEX "Pasco_moderationStatus_createdAt_idx" ON "Pasco"("moderationStatus", "createdAt" DESC);
