/*
  Warnings:

  - You are about to drop the column `year` on the `Pasco` table. All the data in the column will be lost.
  - You are about to drop the column `clerkId` on the `User` table. All the data in the column will be lost.
  - Added the required column `academicYear` to the `Pasco` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "PascoType" ADD VALUE 'RESIT';

-- DropIndex
DROP INDEX "Pasco_courseId_educationLevel_year_idx";

-- DropIndex
DROP INDEX "User_clerkId_key";

-- AlterTable
ALTER TABLE "Pasco" DROP COLUMN "year",
ADD COLUMN     "academicYear" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "clerkId";

-- CreateIndex
CREATE INDEX "Pasco_courseId_educationLevel_academicYear_idx" ON "Pasco"("courseId", "educationLevel", "academicYear");
