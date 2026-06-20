/*
  Warnings:

  - You are about to drop the column `fileExtension` on the `PascoFile` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `PascoFile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PascoFile" DROP COLUMN "fileExtension",
DROP COLUMN "mimeType";
