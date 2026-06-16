import { auth } from "@clerk/nextjs/server";

import {
  createPasco,
  listPascos,
  parsePascoCreate,
  serializePasco,
} from "@/lib/pascos";
import { requireContributor } from "@/lib/require-contributor";
import {
  EducationLevel,
  PascoType,
  SemesterType,
} from "../../../../generated/prisma/enums";

export const runtime = "nodejs";

const EDUCATION_LEVELS = new Set<string>(Object.values(EducationLevel));
const SEMESTER_TYPES = new Set<string>(Object.values(SemesterType));
const PASCO_TYPES = new Set<string>(Object.values(PascoType));

export async function GET(req: Request) {
  const url = new URL(req.url);
  const courseId = url.searchParams.get("courseId");
  const educationLevel = url.searchParams.get("educationLevel");
  const academicYear = url.searchParams.get("academicYear");
  const semesterType = url.searchParams.get("semesterType");
  const type = url.searchParams.get("type");
  const isCompleteParam = url.searchParams.get("isComplete");

  if (educationLevel !== null && !EDUCATION_LEVELS.has(educationLevel)) {
    return Response.json({ error: "Invalid educationLevel" }, { status: 400 });
  }

  if (semesterType !== null && !SEMESTER_TYPES.has(semesterType)) {
    return Response.json({ error: "Invalid semesterType" }, { status: 400 });
  }

  if (type !== null && !PASCO_TYPES.has(type)) {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }

  let isComplete: boolean | undefined;
  if (isCompleteParam !== null) {
    if (isCompleteParam === "true") {
      isComplete = true;
    } else if (isCompleteParam === "false") {
      isComplete = false;
    } else {
      return Response.json({ error: "Invalid isComplete" }, { status: 400 });
    }
  }

  try {
    const result = await listPascos({
      courseId: courseId ?? undefined,
      educationLevel:
        educationLevel !== null
          ? (educationLevel as EducationLevel)
          : undefined,
      academicYear: academicYear ?? undefined,
      semesterType:
        semesterType !== null ? (semesterType as SemesterType) : undefined,
      type: type !== null ? (type as PascoType) : undefined,
      isComplete,
    });

    if (!result.success) {
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }

    return Response.json({
      pascos: result.pascos.map(serializePasco),
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
              "Request must include courseId, files (each with order, publicId, fileName, fileSize, fileExtension, fileUrl, mimeType, resourceType), academicYear, educationLevel, semesterType, type, and contentType",
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
      case "invalid_public_id":
        return Response.json({ error: "Invalid publicId" }, { status: 400 });
      case "invalid_file_name":
        return Response.json({ error: "Invalid fileName" }, { status: 400 });
      case "invalid_file_size":
        return Response.json({ error: "Invalid fileSize" }, { status: 400 });
      case "invalid_file_extension":
        return Response.json(
          { error: "Invalid fileExtension" },
          { status: 400 },
        );
      case "invalid_file_url":
        return Response.json({ error: "Invalid fileUrl" }, { status: 400 });
      case "invalid_mime_type":
        return Response.json({ error: "Invalid mimeType" }, { status: 400 });
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
