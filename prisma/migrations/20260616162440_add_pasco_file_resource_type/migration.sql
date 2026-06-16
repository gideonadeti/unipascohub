-- CreateEnum
CREATE TYPE "CloudinaryResourceType" AS ENUM ('IMAGE', 'RAW');

-- AlterTable
ALTER TABLE "PascoFile" ADD COLUMN     "resourceType" "CloudinaryResourceType" NOT NULL DEFAULT 'IMAGE';
