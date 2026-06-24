import { auth } from "@clerk/nextjs/server";

import {
  deleteCourse,
  getCourseDetailById,
  parseCourseUpdate,
  serializeCourse,
  serializeCourseDetail,
  updateCourse,
} from "@/lib/courses";
import { logError } from "@/lib/logger";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;

  try {
    const result = await getCourseDetailById(courseId);

    if (!result.success) {
      return Response.json({ error: "Course not found" }, { status: 404 });
    }

    return Response.json({
      course: serializeCourseDetail(result.course),
    });
  } catch (err) {
    logError("Course fetch failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
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

  const { courseId } = await params;

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseCourseUpdate(body);

  if (!parsed.success) {
    switch (parsed.error) {
      case "invalid_body":
        return Response.json(
          {
            error:
              "Request must include at least one of: title, code, programIds",
          },
          { status: 400 },
        );
      case "invalid_title":
        return Response.json({ error: "Invalid title" }, { status: 400 });
      case "invalid_code":
        return Response.json({ error: "Invalid code" }, { status: 400 });
      case "invalid_program_ids":
        return Response.json({ error: "Invalid programIds" }, { status: 400 });
    }
  }

  try {
    const result = await updateCourse(courseId, parsed.data);

    if (result.success) {
      return Response.json({
        course: serializeCourse(result.course),
      });
    }

    switch (result.error) {
      case "not_found":
        return Response.json({ error: "Course not found" }, { status: 404 });
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
  } catch (err) {
    logError("Course update failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
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

  const { courseId } = await params;

  try {
    const result = await deleteCourse(courseId);

    if (result.success) {
      return Response.json({ success: true });
    }

    switch (result.error) {
      case "not_found":
        return Response.json({ error: "Course not found" }, { status: 404 });
      case "has_pascos":
        return Response.json(
          { error: "Cannot delete course with linked pascos" },
          { status: 409 },
        );
    }
  } catch (err) {
    logError("Course delete failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
