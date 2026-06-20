-- CreateEnum
CREATE TYPE "StorageCleanupSource" AS ENUM ('PASCO_SYNC', 'PASCO_DELETE', 'ORPHAN_BATCH');

-- CreateTable
CREATE TABLE "StorageCleanupFailure" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "resourceType" "CloudinaryResourceType" NOT NULL,
    "source" "StorageCleanupSource" NOT NULL,
    "pascoId" TEXT,
    "triggeredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "StorageCleanupFailure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageCleanupRun" (
    "id" TEXT NOT NULL,
    "dryRun" BOOLEAN NOT NULL,
    "courseId" TEXT,
    "scanned" INTEGER NOT NULL,
    "orphanCount" INTEGER NOT NULL,
    "deletedCount" INTEGER NOT NULL,
    "failureCount" INTEGER NOT NULL,
    "triggeredById" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageCleanupRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StorageCleanupFailure_publicId_key" ON "StorageCleanupFailure"("publicId");

-- CreateIndex
CREATE INDEX "StorageCleanupFailure_resolvedAt_createdAt_idx" ON "StorageCleanupFailure"("resolvedAt", "createdAt");

-- CreateIndex
CREATE INDEX "StorageCleanupRun_createdAt_idx" ON "StorageCleanupRun"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "StorageCleanupFailure" ADD CONSTRAINT "StorageCleanupFailure_pascoId_fkey" FOREIGN KEY ("pascoId") REFERENCES "Pasco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageCleanupFailure" ADD CONSTRAINT "StorageCleanupFailure_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageCleanupRun" ADD CONSTRAINT "StorageCleanupRun_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
