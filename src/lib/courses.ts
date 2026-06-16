import { prisma } from "@/lib/db";
import type { Course } from "../../generated/prisma/client";
import { Prisma } from "../../generated/prisma/client";

const MAX_TITLE_LENGTH = 200;
const MAX_CODE_LENGTH = 50;

export type CourseCreateInput = {
  programId: string;
  title: string;
  code: string;
};

export type CourseUpdateInput = {
  title?: string;
  code?: string;
};

type CourseError =
  | "not_found"
  | "program_not_found"
  | "duplicate_code"
  | "has_pascos";

type CourseParseError =
  | "invalid_body"
  | "invalid_program_id"
  | "invalid_title"
  | "invalid_code";

function parseTitle(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const title = value.trim();

  if (title.length === 0 || title.length > MAX_TITLE_LENGTH) {
    return null;
  }

  return title;
}

function parseCode(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const code = value.trim();

  if (code.length === 0 || code.length > MAX_CODE_LENGTH) {
    return null;
  }

  return code;
}

function parseProgramId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const programId = value.trim();

  if (programId.length === 0) {
    return null;
  }

  return programId;
}

export function parseCourseCreate(
  body: unknown,
):
  | { success: true; data: CourseCreateInput }
  | { success: false; error: CourseParseError } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "invalid_body" };
  }

  const record = body as Record<string, unknown>;

  if (!("programId" in record) || !("title" in record) || !("code" in record)) {
    return { success: false, error: "invalid_body" };
  }

  const programId = parseProgramId(record.programId);
  const title = parseTitle(record.title);
  const code = parseCode(record.code);

  if (programId === null) {
    return { success: false, error: "invalid_program_id" };
  }

  if (title === null) {
    return { success: false, error: "invalid_title" };
  }

  if (code === null) {
    return { success: false, error: "invalid_code" };
  }

  return { success: true, data: { programId, title, code } };
}

export function parseCourseUpdate(body: unknown):
  | { success: true; data: CourseUpdateInput }
  | {
      success: false;
      error: "invalid_body" | "invalid_title" | "invalid_code";
    } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "invalid_body" };
  }

  const record = body as Record<string, unknown>;
  const data: CourseUpdateInput = {};
  let hasUpdate = false;

  if ("title" in record) {
    hasUpdate = true;

    const title = parseTitle(record.title);
    if (title === null) {
      return { success: false, error: "invalid_title" };
    }

    data.title = title;
  }

  if ("code" in record) {
    hasUpdate = true;

    const code = parseCode(record.code);
    if (code === null) {
      return { success: false, error: "invalid_code" };
    }

    data.code = code;
  }

  if (!hasUpdate) {
    return { success: false, error: "invalid_body" };
  }

  return { success: true, data };
}

export function serializeCourse(course: Course) {
  return {
    id: course.id,
    programId: course.programId,
    title: course.title,
    code: course.code,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  };
}

function isDuplicateCodeError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function listCourses(params?: {
  programId?: string;
}): Promise<{ success: true; courses: Course[] } | { success: false }> {
  const programId = params?.programId;

  const courses = await prisma.course.findMany({
    where: programId ? { programId } : undefined,
    orderBy: { code: "asc" },
  });

  return { success: true, courses };
}

export async function getCourseById(
  courseId: string,
): Promise<
  { success: true; course: Course } | { success: false; error: CourseError }
> {
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    return { success: false, error: "not_found" };
  }

  return { success: true, course };
}

export async function createCourse(
  input: CourseCreateInput,
): Promise<
  | { success: true; course: Course }
  | { success: false; error: "program_not_found" | "duplicate_code" }
> {
  const program = await prisma.program.findUnique({
    where: { id: input.programId },
  });

  if (!program) {
    return { success: false, error: "program_not_found" };
  }

  try {
    const course = await prisma.course.create({
      data: {
        programId: input.programId,
        title: input.title,
        code: input.code,
      },
    });

    return { success: true, course };
  } catch (error) {
    if (isDuplicateCodeError(error)) {
      return { success: false, error: "duplicate_code" };
    }

    throw error;
  }
}

export async function updateCourse(
  courseId: string,
  input: CourseUpdateInput,
): Promise<
  | { success: true; course: Course }
  | { success: false; error: "not_found" | "duplicate_code" }
> {
  const existing = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!existing) {
    return { success: false, error: "not_found" };
  }

  try {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.code !== undefined && { code: input.code }),
      },
    });

    return { success: true, course };
  } catch (error) {
    if (isDuplicateCodeError(error)) {
      return { success: false, error: "duplicate_code" };
    }

    throw error;
  }
}

export async function deleteCourse(
  courseId: string,
): Promise<
  { success: true } | { success: false; error: "not_found" | "has_pascos" }
> {
  const existing = await prisma.course.findUnique({
    where: { id: courseId },
    include: { _count: { select: { pascos: true } } },
  });

  if (!existing) {
    return { success: false, error: "not_found" };
  }

  if (existing._count.pascos > 0) {
    return { success: false, error: "has_pascos" };
  }

  await prisma.course.delete({ where: { id: courseId } });

  return { success: true };
}
