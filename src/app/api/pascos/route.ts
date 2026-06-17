import { auth } from "@clerk/nextjs/server";

import { getViewerReactionsForPascos } from "@/lib/pasco-engagement";
import { parseListPascosQuery } from "@/lib/pasco-list-query";
import {
  createPasco,
  getPascoMaxFileSizeBytes,
  getPascoMaxFilesPerPasco,
  listPascos,
  parsePascoCreate,
  serializePasco,
} from "@/lib/pascos";
import { requireContributor } from "@/lib/require-contributor";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = parseListPascosQuery(url.searchParams);

  if (!parsed.success) {
    switch (parsed.error) {
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
      case "invalid_academic_year":
        return Response.json(
          { error: "Invalid academicYear (expected format YYYY/YYYY)" },
          { status: 400 },
        );
      case "invalid_is_complete":
        return Response.json({ error: "Invalid isComplete" }, { status: 400 });
      case "invalid_page":
        return Response.json(
          { error: "Invalid page (expected a positive integer)" },
          { status: 400 },
        );
      case "invalid_limit":
        return Response.json(
          { error: "Invalid limit (expected an integer from 1 to 100)" },
          { status: 400 },
        );
      case "invalid_sort_by":
        return Response.json(
          {
            error:
              "Invalid sortBy (allowed: createdAt, updatedAt, academicYear, likeCount, dislikeCount, downloadCount, viewCount)",
          },
          { status: 400 },
        );
      case "invalid_sort_order":
        return Response.json(
          { error: "Invalid sortOrder (allowed: asc, desc)" },
          { status: 400 },
        );
    }
  }

  try {
    const result = await listPascos(parsed.data);

    if (!result.success) {
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }

    const { isAuthenticated, userId } = await auth();
    const viewerReactions =
      isAuthenticated && userId
        ? await getViewerReactionsForPascos(
            userId,
            result.pascos.map((pasco) => pasco.id),
          )
        : null;

    const totalPages = Math.ceil(result.total / result.limit);

    return Response.json({
      pascos: result.pascos.map((pasco) =>
        serializePasco(
          pasco,
          viewerReactions
            ? {
                viewerReaction: viewerReactions.get(pasco.id) ?? null,
              }
            : undefined,
        ),
      ),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages,
      },
    });
  } catch (err) {
    console.error("Pasco list failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    }
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parsePascoCreate(body);

  if (!parsed.success) {
    switch (parsed.error) {
      case "invalid_body":
        return Response.json(
          {
            error:
              "Request must include courseId, files (each with order, publicId, fileName, fileSize, fileUrl, resourceType, contentHash), academicYear, educationLevel, semesterType, type, and contentType",
          },
          { status: 400 },
        );
      case "invalid_course_id":
        return Response.json({ error: "Invalid courseId" }, { status: 400 });
      case "invalid_files":
        return Response.json(
          { error: "Invalid files (expected a non-empty array)" },
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
      case "too_many_files":
        return Response.json(
          {
            error: `A pasco cannot have more than ${getPascoMaxFilesPerPasco()} files`,
          },
          { status: 400 },
        );
      case "file_size_exceeded":
        return Response.json(
          {
            error: `Each file must be at most ${getPascoMaxFileSizeBytes()} bytes`,
          },
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
      case "invalid_solution_completeness_for_content_type":
        return Response.json(
          {
            error:
              "solutionCompleteness must not be set when contentType is QUESTIONS_ONLY",
          },
          { status: 400 },
        );
      case "invalid_content_hash":
        return Response.json({ error: "Invalid contentHash" }, { status: 400 });
      case "duplicate_content_hash_in_files":
        return Response.json(
          { error: "Duplicate contentHash values in files" },
          { status: 400 },
        );
    }
  }

  try {
    const result = await createPasco(parsed.data, userId);

    if (!result.success) {
      switch (result.error) {
        case "course_not_found":
          return Response.json({ error: "Course not found" }, { status: 404 });
        case "duplicate_public_id":
          return Response.json(
            { error: "A pasco file with this publicId already exists" },
            { status: 409 },
          );
        case "duplicate_file_content":
          return Response.json(
            {
              error: "duplicate_file_content",
              message: "This exact file already exists.",
              duplicates: result.duplicates ?? [],
            },
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

    return Response.json(
      { pasco: serializePasco(result.pasco) },
      { status: 201 },
    );
  } catch (err) {
    console.error("Pasco create failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
