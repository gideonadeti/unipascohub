-- CreateEnum
CREATE TYPE "CatalogSubmissionType" AS ENUM ('PROGRAM', 'COURSE');

-- CreateEnum
CREATE TYPE "CatalogSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "CatalogSubmission" (
    "id" TEXT NOT NULL,
    "type" "CatalogSubmissionType" NOT NULL,
    "status" "CatalogSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "institutionId" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "programName" TEXT,
    "programType" "ProgramType",
    "courseCode" TEXT,
    "courseTitle" TEXT,
    "programIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rejectionReason" TEXT,
    "approvedProgramId" TEXT,
    "approvedCourseId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogSubmission_status_createdAt_idx" ON "CatalogSubmission"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CatalogSubmission_submitterId_createdAt_idx" ON "CatalogSubmission"("submitterId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CatalogSubmission_institutionId_type_status_idx" ON "CatalogSubmission"("institutionId", "type", "status");

-- AddForeignKey
ALTER TABLE "CatalogSubmission" ADD CONSTRAINT "CatalogSubmission_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogSubmission" ADD CONSTRAINT "CatalogSubmission_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogSubmission" ADD CONSTRAINT "CatalogSubmission_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
