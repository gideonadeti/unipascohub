-- CreateEnum
CREATE TYPE "StudyMode" AS ENUM ('FULL_TIME', 'PART_TIME', 'DISTANCE', 'EVENING', 'WEEKEND');

-- DropIndex
DROP INDEX "Pasco_courseId_educationLevel_academicYear_idx";

-- AlterTable
ALTER TABLE "Pasco" ADD COLUMN     "studyMode" "StudyMode" NOT NULL DEFAULT 'FULL_TIME';

-- CreateIndex
CREATE INDEX "Pasco_courseId_educationLevel_studyMode_academicYear_idx" ON "Pasco"("courseId", "educationLevel", "studyMode", "academicYear");
