/*
  Warnings:

  - The values [OTHER] on the enum `EducationLevel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EducationLevel_new" AS ENUM ('JHS', 'SHS', 'UNDERGRADUATE', 'POSTGRADUATE');
ALTER TABLE "User" ALTER COLUMN "educationLevel" TYPE "EducationLevel_new" USING ("educationLevel"::text::"EducationLevel_new");
ALTER TYPE "EducationLevel" RENAME TO "EducationLevel_old";
ALTER TYPE "EducationLevel_new" RENAME TO "EducationLevel";
DROP TYPE "public"."EducationLevel_old";
COMMIT;
