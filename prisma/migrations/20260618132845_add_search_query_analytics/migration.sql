-- CreateEnum
CREATE TYPE "SearchQuerySource" AS ENUM ('SUGGEST', 'BROWSE_LIST');

-- DropIndex
DROP INDEX "course_code_trgm_idx";

-- DropIndex
DROP INDEX "course_title_trgm_idx";

-- DropIndex
DROP INDEX "institution_name_trgm_idx";

-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "source" "SearchQuerySource" NOT NULL,
    "userId" TEXT,
    "resultCount" INTEGER,
    "noCourseMatch" BOOLEAN,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchQuery_createdAt_idx" ON "SearchQuery"("createdAt");

-- CreateIndex
CREATE INDEX "SearchQuery_source_createdAt_idx" ON "SearchQuery"("source", "createdAt");

-- CreateIndex
CREATE INDEX "SearchQuery_query_idx" ON "SearchQuery"("query");

-- AddForeignKey
ALTER TABLE "SearchQuery" ADD CONSTRAINT "SearchQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
