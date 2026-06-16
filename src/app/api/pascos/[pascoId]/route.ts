import { auth } from "@clerk/nextjs/server";

import {
  deletePasco,
  getPascoById,
  parsePascoUpdate,
  serializePasco,
  updatePasco,
} from "@/lib/pascos";
import { canModifyPasco } from "@/lib/require-contributor";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pascoId: string }> },
) {
  const { pascoId } = await params;

  try {
    const result = await getPascoById(pascoId);

    if (!result.success) {
      return Response.json({ error: "Pasco not found" }, { status: 404 });
    }

    return Response.json({
      pasco: serializePasco(result.pasco),
    });
  } catch (err) {
    console.error("Pasco fetch failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ pascoId: string }> },
) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pascoId } = await params;

  const existingResult = await getPascoById(pascoId);

  if (!existingResult.success) {
    return Response.json({ error: "Pasco not found" }, { status: 404 });
  }

  const modifyResult = await canModifyPasco(userId, existingResult.pasco);

  if (!modifyResult.success) {
    switch (modifyResult.error) {
      case "not_found":
        return Response.json({ error: "User not found" }, { status: 404 });
      case "forbidden":
        return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parsePascoUpdate(body);

  if (!parsed.success) {
    switch (parsed.error) {
      case "invalid_body":
        return Response.json(
          {
            error:
              "Request must include at least one of: academicYear, description, educationLevel, semesterType, type, contentType, solutionCompleteness, isComplete, files",
          },
          { status: 400 },
        );
      case "invalid_academic_year":
        return Response.json(
          { error: "Invalid academicYear (expected format YYYY/YYYY)" },
          { status: 400 },
        );
      case "invalid_description":
        return Response.json({ error: "Invalid description" }, { status: 400 });
      case "invalid_education_level":
        return Response.json(
          { error: "Invalid educationLevel" },
          { status: 400 },
        );
      case "invalid_semester_type":
        return Response.json(
          { error: "Invalid semesterType" },
          { status: 400 },
        );
      case "invalid_type":
        return Response.json({ error: "Invalid type" }, { status: 400 });
      case "invalid_content_type":
        return Response.json({ error: "Invalid contentType" }, { status: 400 });
      case "invalid_is_complete":
        return Response.json({ error: "Invalid isComplete" }, { status: 400 });
      case "invalid_solution_completeness":
        return Response.json(
          { error: "Invalid solutionCompleteness" },
          { status: 400 },
        );
      case "invalid_files":
        return Response.json(
          { error: "Invalid files (expected a non-empty array)" },
          { status: 400 },
        );
      case "conflicting_file_update":
        return Response.json(
          { error: "Use files instead of addFiles for file updates" },
          { status: 400 },
        );
      case "invalid_file_id":
        return Response.json({ error: "Invalid file id" }, { status: 400 });
      case "duplicate_file_id_in_payload":
        return Response.json(
          { error: "Duplicate file id values in files" },
          { status: 400 },
        );
      case "invalid_existing_file_payload":
        return Response.json(
          { error: "Existing files may only include id and order" },
          { status: 400 },
        );
      case "invalid_file_order":
        return Response.json(
          { error: "Invalid file order (expected a positive integer)" },
          { status: 400 },
        );
      case "duplicate_order_in_files":
        return Response.json(
          { error: "Duplicate order values in files" },
          { status: 400 },
        );
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
          { error: "PDFs must use resourceType IMAGE" },
          { status: 400 },
        );
    }
  }

  try {
    const result = await updatePasco(pascoId, parsed.data);

    if (!result.success) {
      switch (result.error) {
        case "not_found":
          return Response.json({ error: "Pasco not found" }, { status: 404 });
        case "invalid_solution_completeness_for_content_type":
          return Response.json(
            {
              error:
                "solutionCompleteness must not be set when contentType is QUESTIONS_ONLY",
            },
            { status: 400 },
          );
        case "unknown_file_id":
          return Response.json(
            { error: "File id does not belong to this pasco" },
            { status: 400 },
          );
        case "cloudinary_delete_failed":
          return Response.json(
            {
              error: "Failed to delete file from storage",
              failedPublicIds: result.failedPublicIds ?? [],
            },
            { status: 502 },
          );
        case "duplicate_public_id":
          return Response.json(
            { error: "A pasco file with this publicId already exists" },
            { status: 409 },
          );
        case "asset_not_found":
          return Response.json(
            { error: "File not found in storage" },
            { status: 400 },
          );
        case "asset_folder_mismatch":
          return Response.json(
            { error: "File was not uploaded to the expected course folder" },
            { status: 400 },
          );
        case "asset_size_mismatch":
          return Response.json(
            { error: "File size does not match the uploaded asset" },
            { status: 400 },
          );
        case "asset_url_mismatch":
          return Response.json(
            { error: "File URL does not match the uploaded asset" },
            { status: 400 },
          );
        case "asset_resource_type_mismatch":
          return Response.json(
            { error: "File resource type does not match the uploaded asset" },
            { status: 400 },
          );
        case "invalid_pdf_resource_type":
          return Response.json(
            { error: "PDFs must use resourceType IMAGE" },
            { status: 400 },
          );
      }
    }

    return Response.json({
      pasco: serializePasco(result.pasco),
    });
  } catch (err) {
    console.error("Pasco update failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pascoId: string }> },
) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pascoId } = await params;

  const existingResult = await getPascoById(pascoId);

  if (!existingResult.success) {
    return Response.json({ error: "Pasco not found" }, { status: 404 });
  }

  const modifyResult = await canModifyPasco(userId, existingResult.pasco);

  if (!modifyResult.success) {
    switch (modifyResult.error) {
      case "not_found":
        return Response.json({ error: "User not found" }, { status: 404 });
      case "forbidden":
        return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const result = await deletePasco(pascoId);

    if (!result.success) {
      switch (result.error) {
        case "not_found":
          return Response.json({ error: "Pasco not found" }, { status: 404 });
        case "cloudinary_delete_failed":
          return Response.json(
            {
              error: "Failed to delete file from storage",
              failedPublicIds: result.failedPublicIds ?? [],
            },
            { status: 502 },
          );
      }
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Pasco delete failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
