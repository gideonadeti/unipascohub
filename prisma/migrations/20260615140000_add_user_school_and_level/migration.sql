-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('JHS', 'SHS', 'UNDERGRADUATE', 'POSTGRADUATE', 'OTHER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "school" TEXT,
ADD COLUMN "level" "EducationLevel";
