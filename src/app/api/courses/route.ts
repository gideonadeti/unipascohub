import { auth } from "@clerk/nextjs/server";

import {
  createCourse,
  listCourses,
  parseCourseCreate,
  serializeCourse,
} from "@/lib/courses";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const programId = url.searchParams.get("programId");

  try {
    const result = await listCourses({
      programId: programId ?? undefined,
    });

    if (!result.success) {
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }

    return Response.json({
      courses: result.courses.map(serializeCourse),
    });
  } catch (err) {
    console.error("Course list failed:", err);

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
          { error: "Request must include programId, title, and code" },
          { status: 400 },
        );
      case "invalid_program_id":
        return Response.json({ error: "Invalid programId" }, { status: 400 });
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
        case "program_not_found":
          return Response.json({ error: "Program not found" }, { status: 404 });
        case "duplicate_code":
          return Response.json(
            { error: "Course code already exists for this program" },
            { status: 409 },
          );
      }
    }

    return Response.json(
      { course: serializeCourse(result.course) },
      { status: 201 },
    );
  } catch (err) {
    console.error("Course create failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
