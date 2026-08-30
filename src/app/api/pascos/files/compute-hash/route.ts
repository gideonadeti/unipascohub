import { auth } from "@clerk/nextjs/server";

import {
  hashCloudinaryFile,
  parseComputeCloudinaryFileHashInput,
} from "@/lib/cloudinary";
import { prisma } from "@/lib/db";
import { requireContributor } from "@/lib/require-contributor";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contributorResult = await requireContributor(userId);

  if (!contributorResult.success) {
    switch (contributorResult.error) {
      case "not_found":
        return Response.json({ error: "User not found" }, { status: 404 });
      case "forbidden":
        return Response.json({ error: "Forbidden" }, { status: 403 });
      default:
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseComputeCloudinaryFileHashInput(body);

  if (!parsed.success) {
    switch (parsed.error) {
      case "invalid_body":
        return Response.json(
          {
            error:
              "Request must include courseId, publicId, fileName, fileSize, fileUrl, and resourceType",
          },
          { status: 400 },
        );
      case "invalid_course_id":
        return Response.json({ error: "Invalid courseId" }, { status: 400 });
      case "invalid_public_id":
        return Response.json({ error: "Invalid publicId" }, { status: 400 });
      case "invalid_file_name":
        return Response.json({ error: "Invalid fileName" }, { status: 400 });
      case "invalid_file_size":
        return Response.json({ error: "Invalid fileSize" }, { status: 400 });
      case "invalid_file_url":
        return Response.json({ error: "Invalid fileUrl" }, { status: 400 });
      case "invalid_resource_type":
        return Response.json(
          { error: "Invalid resourceType" },
          { status: 400 },
        );
      case "invalid_pdf_resource_type":
        return Response.json(
          { error: "PDF files must use IMAGE resource type" },
          { status: 400 },
        );
      case "unsupported_file_type":
        return Response.json(
          { error: "Only PDF, image, and document files are allowed" },
          { status: 400 },
        );
      case "file_size_exceeded":
        return Response.json(
          { error: "File size exceeds limit" },
          { status: 400 },
        );
    }
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { id: true },
  });

  if (!course) {
    return Response.json({ error: "Course not found" }, { status: 404 });
  }

  const result = await hashCloudinaryFile({
    publicId: parsed.data.publicId,
    fileUrl: parsed.data.fileUrl,
    fileSize: parsed.data.fileSize,
    resourceType: parsed.data.resourceType,
    expectedAssetFolder: `pascos/${parsed.data.courseId}`,
    fileName: parsed.data.fileName,
  });

  if (!result.success) {
    switch (result.error) {
      case "missing_config":
        return Response.json(
          { error: "Cloudinary is not configured" },
          { status: 500 },
        );
      case "download_failed":
        return Response.json(
          { error: "Could not download uploaded file for fingerprinting" },
          { status: 502 },
        );
      case "asset_not_found":
        return Response.json(
          { error: "Uploaded asset not found" },
          { status: 404 },
        );
      case "asset_folder_mismatch":
        return Response.json(
          { error: "Asset folder mismatch" },
          { status: 400 },
        );
      case "asset_size_mismatch":
        return Response.json({ error: "Asset size mismatch" }, { status: 400 });
      case "asset_url_mismatch":
        return Response.json({ error: "Asset URL mismatch" }, { status: 400 });
      case "asset_resource_type_mismatch":
        return Response.json(
          { error: "Asset resource type mismatch" },
          { status: 400 },
        );
      case "invalid_pdf_resource_type":
        return Response.json(
          { error: "PDF files must use IMAGE resource type" },
          { status: 400 },
        );
      case "unsupported_file_type":
        return Response.json(
          { error: "Only PDF, image, and document files are allowed" },
          { status: 400 },
        );
    }
  }

  return Response.json({ contentHash: result.contentHash });
}
