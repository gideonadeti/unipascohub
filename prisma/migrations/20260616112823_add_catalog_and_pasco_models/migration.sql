-- CreateEnum
CREATE TYPE "PascoType" AS ENUM ('MID_SEM', 'END_OF_SEM');

-- CreateEnum
CREATE TYPE "SemesterType" AS ENUM ('FIRST_SEMESTER', 'SECOND_SEMESTER');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('LEVEL_100', 'LEVEL_200', 'LEVEL_300', 'LEVEL_400');

-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('BACHELOR', 'BTECH', 'HND', 'DIPLOMA');

-- CreateEnum
CREATE TYPE "PascoContentType" AS ENUM ('QUESTIONS_ONLY', 'QUESTIONS_AND_ANSWERS', 'ANSWERS_ONLY');

-- CreateEnum
CREATE TYPE "SolutionCompleteness" AS ENUM ('FULLY_SOLVED', 'PARTIALLY_SOLVED');

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "ProgramType" NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pasco" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileExtension" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "uploaderId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "educationLevel" "EducationLevel" NOT NULL,
    "type" "PascoType" NOT NULL,
    "semesterType" "SemesterType" NOT NULL,
    "contentType" "PascoContentType" NOT NULL,
    "solutionCompleteness" "SolutionCompleteness",

    CONSTRAINT "Pasco_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institution_name_key" ON "Institution"("name");

-- CreateIndex
CREATE INDEX "Program_institutionId_type_idx" ON "Program"("institutionId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Program_institutionId_name_type_key" ON "Program"("institutionId", "name", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Course_programId_code_key" ON "Course"("programId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Pasco_publicId_key" ON "Pasco"("publicId");

-- CreateIndex
CREATE INDEX "Pasco_courseId_educationLevel_year_idx" ON "Pasco"("courseId", "educationLevel", "year");

-- CreateIndex
CREATE INDEX "Pasco_uploaderId_idx" ON "Pasco"("uploaderId");

-- CreateIndex
CREATE INDEX "Pasco_createdAt_idx" ON "Pasco"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pasco" ADD CONSTRAINT "Pasco_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pasco" ADD CONSTRAINT "Pasco_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
