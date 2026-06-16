-- CreateEnum
CREATE TYPE "PascoReactionType" AS ENUM ('LIKE', 'DISLIKE');

-- AlterTable
ALTER TABLE "Pasco" ADD COLUMN     "dislikeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "downloadCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PascoReaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pascoId" TEXT NOT NULL,
    "reactionType" "PascoReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PascoReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PascoDownload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pascoId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PascoDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PascoReaction_pascoId_reactionType_idx" ON "PascoReaction"("pascoId", "reactionType");

-- CreateIndex
CREATE UNIQUE INDEX "PascoReaction_userId_pascoId_key" ON "PascoReaction"("userId", "pascoId");

-- CreateIndex
CREATE INDEX "PascoDownload_pascoId_createdAt_idx" ON "PascoDownload"("pascoId", "createdAt");

-- CreateIndex
CREATE INDEX "PascoDownload_userId_pascoId_idx" ON "PascoDownload"("userId", "pascoId");

-- CreateIndex
CREATE INDEX "Pasco_likeCount_idx" ON "Pasco"("likeCount" DESC);

-- CreateIndex
CREATE INDEX "Pasco_downloadCount_idx" ON "Pasco"("downloadCount" DESC);

-- AddForeignKey
ALTER TABLE "PascoReaction" ADD CONSTRAINT "PascoReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PascoReaction" ADD CONSTRAINT "PascoReaction_pascoId_fkey" FOREIGN KEY ("pascoId") REFERENCES "Pasco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PascoDownload" ADD CONSTRAINT "PascoDownload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PascoDownload" ADD CONSTRAINT "PascoDownload_pascoId_fkey" FOREIGN KEY ("pascoId") REFERENCES "Pasco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PascoDownload" ADD CONSTRAINT "PascoDownload_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "PascoFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
