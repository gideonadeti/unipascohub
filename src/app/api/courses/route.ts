import { auth } from "@clerk/nextjs/server";

import {
  createCourse,
  listCourses,
  parseCourseCreate,
  serializeCourse,
} from "@/lib/courses";
import { logError } from "@/lib/logger";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const institutionId = url.searchParams.get("institutionId");
  const programId = url.searchParams.get("programId");

  try {
    const result = await listCourses({
      institutionId: institutionId ?? undefined,
      programId: programId ?? undefined,
    });

    if (!result.success) {
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }

    return Response.json({
      courses: result.courses.map(serializeCourse),
    });
  } catch (err) {
    logError("Course list failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminResult = await requireAdmin(userId);

  if (!adminResult.success) {
    switch (adminResult.error) {
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

  const parsed = parseCourseCreate(body);

  if (!parsed.success) {
    switch (parsed.error) {
      case "invalid_body":
        return Response.json(
          { error: "Request must include institutionId, title, and code" },
          { status: 400 },
        );
      case "invalid_institution_id":
        return Response.json(
          { error: "Invalid institutionId" },
          { status: 400 },
        );
      case "invalid_program_ids":
        return Response.json({ error: "Invalid programIds" }, { status: 400 });
      case "invalid_title":
        return Response.json({ error: "Invalid title" }, { status: 400 });
      case "invalid_code":
        return Response.json({ error: "Invalid code" }, { status: 400 });
    }
  }

  try {
    const result = await createCourse(parsed.data);

    if (!result.success) {
      switch (result.error) {
        case "institution_not_found":
          return Response.json(
            { error: "Institution not found" },
            { status: 404 },
          );
        case "program_not_found":
          return Response.json({ error: "Program not found" }, { status: 404 });
        case "program_institution_mismatch":
          return Response.json(
            { error: "Programs must belong to the same institution" },
            { status: 400 },
          );
        case "duplicate_code":
          return Response.json(
            { error: "Course code already exists for this institution" },
            { status: 409 },
          );
      }
    }

    return Response.json(
      { course: serializeCourse(result.course) },
      { status: 201 },
    );
  } catch (err) {
    logError("Course create failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
