/*
  Warnings:

  - You are about to drop the column `fileExtension` on the `Pasco` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `Pasco` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `Pasco` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `Pasco` table. All the data in the column will be lost.
  - You are about to drop the column `publicId` on the `Pasco` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Pasco_publicId_key";

-- AlterTable
ALTER TABLE "Pasco" DROP COLUMN "fileExtension",
DROP COLUMN "fileName",
DROP COLUMN "fileSize",
DROP COLUMN "fileUrl",
DROP COLUMN "publicId";

-- CreateTable
CREATE TABLE "PascoFile" (
    "id" TEXT NOT NULL,
    "pascoId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "publicId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileExtension" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PascoFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PascoFile_publicId_key" ON "PascoFile"("publicId");

-- CreateIndex
CREATE INDEX "PascoFile_pascoId_idx" ON "PascoFile"("pascoId");

-- CreateIndex
CREATE UNIQUE INDEX "PascoFile_pascoId_order_key" ON "PascoFile"("pascoId", "order");

-- AddForeignKey
ALTER TABLE "PascoFile" ADD CONSTRAINT "PascoFile_pascoId_fkey" FOREIGN KEY ("pascoId") REFERENCES "Pasco"("id") ON DELETE CASCADE ON UPDATE CASCADE;
