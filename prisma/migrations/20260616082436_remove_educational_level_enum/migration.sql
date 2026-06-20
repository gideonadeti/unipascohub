/*
  Warnings:

  - You are about to drop the column `educationLevel` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "educationLevel";

-- DropEnum
DROP TYPE "EducationLevel";
