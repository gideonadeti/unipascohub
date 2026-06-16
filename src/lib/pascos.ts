import { prisma } from "@/lib/db";
import type { Pasco } from "../../generated/prisma/client";
import { Prisma } from "../../generated/prisma/client";
import {
  EducationLevel,
  type EducationLevel as EducationLevelType,
  PascoContentType,
  type PascoContentType as PascoContentTypeType,
  PascoType,
  type PascoType as PascoTypeType,
  SemesterType,
  type SemesterType as SemesterTypeType,
  SolutionCompleteness,
  type SolutionCompleteness as SolutionCompletenessType,
} from "../../generated/prisma/enums";

const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_FILE_NAME_LENGTH = 255;
const MAX_FILE_EXTENSION_LENGTH = 20;
const MAX_PUBLIC_ID_LENGTH = 500;
const MAX_FILE_URL_LENGTH = 2000;

const EDUCATION_LEVELS = new Set<string>(Object.values(EducationLevel));
const SEMESTER_TYPES = new Set<string>(Object.values(SemesterType));
const PASCO_TYPES = new Set<string>(Object.values(PascoType));
const PASCO_CONTENT_TYPES = new Set<string>(Object.values(PascoContentType));
const SOLUTION_COMPLETENESS_VALUES = new Set<string>(
  Object.values(SolutionCompleteness),
);

export type PascoCreateInput = {
  courseId: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  fileExtension: string;
  fileUrl: string;
  academicYear: string;
  description?: string;
  educationLevel: EducationLevelType;
  semesterType: SemesterTypeType;
  type: PascoTypeType;
  contentType: PascoContentTypeType;
  solutionCompleteness?: SolutionCompletenessType | null;
  isComplete?: boolean;
};

export type PascoUpdateInput = {
  academicYear?: string;
  description?: string | null;
  educationLevel?: EducationLevelType;
  semesterType?: SemesterTypeType;
  type?: PascoTypeType;
  contentType?: PascoContentTypeType;
  solutionCompleteness?: SolutionCompletenessType | null;
  isComplete?: boolean;
};

type PascoError = "not_found" | "course_not_found" | "duplicate_public_id";

type PascoCreateParseError =
  | "invalid_body"
  | "invalid_course_id"
  | "invalid_public_id"
  | "invalid_file_name"
  | "invalid_file_size"
  | "invalid_file_extension"
  | "invalid_file_url"
  | "invalid_academic_year"
  | "invalid_description"
  | "invalid_education_level"
  | "invalid_semester_type"
  | "invalid_type"
  | "invalid_content_type"
  | "invalid_is_complete"
  | "invalid_solution_completeness"
  | "invalid_solution_completeness_for_content_type";

type PascoUpdateParseError =
  | "invalid_body"
  | "invalid_academic_year"
  | "invalid_description"
  | "invalid_education_level"
  | "invalid_semester_type"
  | "invalid_type"
  | "invalid_content_type"
  | "invalid_is_complete"
  | "invalid_solution_completeness";

function parseCourseId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const courseId = value.trim();

  if (courseId.length === 0) {
    return null;
  }

  return courseId;
}

function parseNonEmptyString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0 || trimmed.length > maxLength) {
    return null;
  }

  return trimmed;
}

function parseFileSize(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

function parseAcademicYear(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const academicYear = value.trim();
  const match = /^(\d{4})\/(\d{4})$/.exec(academicYear);

  if (!match) {
    return null;
  }

  const startYear = Number.parseInt(match[1], 10);
  const endYear = Number.parseInt(match[2], 10);

  if (endYear !== startYear + 1) {
    return null;
  }

  return academicYear;
}

function parseDescription(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const description = value.trim();

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return null;
  }

  return description.length === 0 ? null : description;
}

function isEducationLevel(value: string): value is EducationLevelType {
  return EDUCATION_LEVELS.has(value);
}

function isSemesterType(value: string): value is SemesterTypeType {
  return SEMESTER_TYPES.has(value);
}

function isPascoType(value: string): value is PascoTypeType {
  return PASCO_TYPES.has(value);
}

function isPascoContentType(value: string): value is PascoContentTypeType {
  return PASCO_CONTENT_TYPES.has(value);
}

function parseIsComplete(value: unknown): boolean | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    return null;
  }

  return value;
}

function isSolutionCompleteness(
  value: string,
): value is SolutionCompletenessType {
  return SOLUTION_COMPLETENESS_VALUES.has(value);
}

function parseSolutionCompleteness(
  value: unknown,
): SolutionCompletenessType | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string" || !isSolutionCompleteness(value)) {
    return null;
  }

  return value;
}

function validateSolutionCompletenessForContentType(
  contentType: PascoContentTypeType,
  solutionCompleteness: SolutionCompletenessType | null | undefined,
): boolean {
  if (contentType === PascoContentType.QUESTIONS_ONLY) {
    return solutionCompleteness === undefined || solutionCompleteness === null;
  }

  return true;
}

export function parsePascoCreate(
  body: unknown,
):
  | { success: true; data: PascoCreateInput }
  | { success: false; error: PascoCreateParseError } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "invalid_body" };
  }

  const record = body as Record<string, unknown>;

  const requiredFields = [
    "courseId",
    "publicId",
    "fileName",
    "fileSize",
    "fileExtension",
    "fileUrl",
    "academicYear",
    "educationLevel",
    "semesterType",
    "type",
    "contentType",
  ] as const;

  if (!requiredFields.every((field) => field in record)) {
    return { success: false, error: "invalid_body" };
  }

  const courseId = parseCourseId(record.courseId);
  const publicId = parseNonEmptyString(record.publicId, MAX_PUBLIC_ID_LENGTH);
  const fileName = parseNonEmptyString(record.fileName, MAX_FILE_NAME_LENGTH);
  const fileSize = parseFileSize(record.fileSize);
  const fileExtension = parseNonEmptyString(
    record.fileExtension,
    MAX_FILE_EXTENSION_LENGTH,
  );
  const fileUrl = parseNonEmptyString(record.fileUrl, MAX_FILE_URL_LENGTH);
  const academicYear = parseAcademicYear(record.academicYear);

  if (courseId === null) {
    return { success: false, error: "invalid_course_id" };
  }

  if (publicId === null) {
    return { success: false, error: "invalid_public_id" };
  }

  if (fileName === null) {
    return { success: false, error: "invalid_file_name" };
  }

  if (fileSize === null) {
    return { success: false, error: "invalid_file_size" };
  }

  if (fileExtension === null) {
    return { success: false, error: "invalid_file_extension" };
  }

  if (fileUrl === null) {
    return { success: false, error: "invalid_file_url" };
  }

  if (academicYear === null) {
    return { success: false, error: "invalid_academic_year" };
  }

  const description = parseDescription(record.description);
  if (description === null && record.description !== null) {
    return { success: false, error: "invalid_description" };
  }

  if (
    typeof record.educationLevel !== "string" ||
    !isEducationLevel(record.educationLevel)
  ) {
    return { success: false, error: "invalid_education_level" };
  }

  if (
    typeof record.semesterType !== "string" ||
    !isSemesterType(record.semesterType)
  ) {
    return { success: false, error: "invalid_semester_type" };
  }

  if (typeof record.type !== "string" || !isPascoType(record.type)) {
    return { success: false, error: "invalid_type" };
  }

  if (
    typeof record.contentType !== "string" ||
    !isPascoContentType(record.contentType)
  ) {
    return { success: false, error: "invalid_content_type" };
  }

  const isComplete = parseIsComplete(record.isComplete);
  if (isComplete === null) {
    return { success: false, error: "invalid_is_complete" };
  }

  const solutionCompleteness = parseSolutionCompleteness(
    record.solutionCompleteness,
  );

  if (
    solutionCompleteness === null &&
    record.solutionCompleteness !== null &&
    record.solutionCompleteness !== undefined
  ) {
    return { success: false, error: "invalid_solution_completeness" };
  }

  if (
    !validateSolutionCompletenessForContentType(
      record.contentType,
      solutionCompleteness,
    )
  ) {
    return {
      success: false,
      error: "invalid_solution_completeness_for_content_type",
    };
  }

  return {
    success: true,
    data: {
      courseId,
      publicId,
      fileName,
      fileSize,
      fileExtension,
      fileUrl,
      academicYear,
      educationLevel: record.educationLevel,
      semesterType: record.semesterType,
      type: record.type,
      contentType: record.contentType,
      ...(isComplete !== undefined && { isComplete }),
      ...(description !== undefined && description !== null && { description }),
      ...(solutionCompleteness !== undefined &&
        solutionCompleteness !== null && { solutionCompleteness }),
    },
  };
}

export function parsePascoUpdate(
  body: unknown,
):
  | { success: true; data: PascoUpdateInput }
  | { success: false; error: PascoUpdateParseError } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "invalid_body" };
  }

  const record = body as Record<string, unknown>;
  const data: PascoUpdateInput = {};
  let hasUpdate = false;

  if ("academicYear" in record) {
    hasUpdate = true;

    const academicYear = parseAcademicYear(record.academicYear);
    if (academicYear === null) {
      return { success: false, error: "invalid_academic_year" };
    }

    data.academicYear = academicYear;
  }

  if ("description" in record) {
    hasUpdate = true;

    const description = parseDescription(record.description);
    if (description === null && record.description !== null) {
      return { success: false, error: "invalid_description" };
    }

    data.description = description ?? null;
  }

  if ("educationLevel" in record) {
    hasUpdate = true;

    if (
      typeof record.educationLevel !== "string" ||
      !isEducationLevel(record.educationLevel)
    ) {
      return { success: false, error: "invalid_education_level" };
    }

    data.educationLevel = record.educationLevel;
  }

  if ("semesterType" in record) {
    hasUpdate = true;

    if (
      typeof record.semesterType !== "string" ||
      !isSemesterType(record.semesterType)
    ) {
      return { success: false, error: "invalid_semester_type" };
    }

    data.semesterType = record.semesterType;
  }

  if ("type" in record) {
    hasUpdate = true;

    if (typeof record.type !== "string" || !isPascoType(record.type)) {
      return { success: false, error: "invalid_type" };
    }

    data.type = record.type;
  }

  if ("contentType" in record) {
    hasUpdate = true;

    if (
      typeof record.contentType !== "string" ||
      !isPascoContentType(record.contentType)
    ) {
      return { success: false, error: "invalid_content_type" };
    }

    data.contentType = record.contentType;
  }

  if ("isComplete" in record) {
    hasUpdate = true;

    const isComplete = parseIsComplete(record.isComplete);
    if (isComplete === null || isComplete === undefined) {
      return { success: false, error: "invalid_is_complete" };
    }

    data.isComplete = isComplete;
  }

  if ("solutionCompleteness" in record) {
    hasUpdate = true;

    const solutionCompleteness = parseSolutionCompleteness(
      record.solutionCompleteness,
    );

    if (solutionCompleteness === null && record.solutionCompleteness !== null) {
      return { success: false, error: "invalid_solution_completeness" };
    }

    data.solutionCompleteness = solutionCompleteness ?? null;
  }

  if (!hasUpdate) {
    return { success: false, error: "invalid_body" };
  }

  return { success: true, data };
}

export function serializePasco(pasco: Pasco) {
  return {
    id: pasco.id,
    courseId: pasco.courseId,
    uploaderId: pasco.uploaderId,
    publicId: pasco.publicId,
    fileName: pasco.fileName,
    fileSize: pasco.fileSize,
    fileExtension: pasco.fileExtension,
    fileUrl: pasco.fileUrl,
    academicYear: pasco.academicYear,
    description: pasco.description,
    educationLevel: pasco.educationLevel,
    semesterType: pasco.semesterType,
    type: pasco.type,
    contentType: pasco.contentType,
    solutionCompleteness: pasco.solutionCompleteness,
    isComplete: pasco.isComplete,
    createdAt: pasco.createdAt.toISOString(),
    updatedAt: pasco.updatedAt.toISOString(),
  };
}

function isDuplicatePublicIdError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function validateUpdateSolutionCompleteness(
  existing: Pasco,
  input: PascoUpdateInput,
): boolean {
  const contentType = input.contentType ?? existing.contentType;
  const solutionCompleteness =
    "solutionCompleteness" in input
      ? input.solutionCompleteness
      : existing.solutionCompleteness;

  return validateSolutionCompletenessForContentType(
    contentType,
    solutionCompleteness,
  );
}

export async function listPascos(params?: {
  courseId?: string;
  educationLevel?: EducationLevelType;
  academicYear?: string;
  semesterType?: SemesterTypeType;
  type?: PascoTypeType;
  isComplete?: boolean;
}): Promise<{ success: true; pascos: Pasco[] } | { success: false }> {
  const pascos = await prisma.pasco.findMany({
    where: {
      ...(params?.courseId ? { courseId: params.courseId } : {}),
      ...(params?.educationLevel
        ? { educationLevel: params.educationLevel }
        : {}),
      ...(params?.academicYear ? { academicYear: params.academicYear } : {}),
      ...(params?.semesterType ? { semesterType: params.semesterType } : {}),
      ...(params?.type ? { type: params.type } : {}),
      ...(params?.isComplete !== undefined
        ? { isComplete: params.isComplete }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, pascos };
}

export async function getPascoById(
  pascoId: string,
): Promise<
  { success: true; pasco: Pasco } | { success: false; error: PascoError }
> {
  const pasco = await prisma.pasco.findUnique({ where: { id: pascoId } });

  if (!pasco) {
    return { success: false, error: "not_found" };
  }

  return { success: true, pasco };
}

export async function createPasco(
  input: PascoCreateInput,
  uploaderId: string,
): Promise<
  | { success: true; pasco: Pasco }
  | { success: false; error: "course_not_found" | "duplicate_public_id" }
> {
  const course = await prisma.course.findUnique({
    where: { id: input.courseId },
  });

  if (!course) {
    return { success: false, error: "course_not_found" };
  }

  try {
    const pasco = await prisma.pasco.create({
      data: {
        courseId: input.courseId,
        uploaderId,
        publicId: input.publicId,
        fileName: input.fileName,
        fileSize: input.fileSize,
        fileExtension: input.fileExtension,
        fileUrl: input.fileUrl,
        academicYear: input.academicYear,
        description: input.description ?? null,
        educationLevel: input.educationLevel,
        semesterType: input.semesterType,
        type: input.type,
        contentType: input.contentType,
        solutionCompleteness: input.solutionCompleteness ?? null,
        isComplete: input.isComplete ?? true,
      },
    });

    return { success: true, pasco };
  } catch (error) {
    if (isDuplicatePublicIdError(error)) {
      return { success: false, error: "duplicate_public_id" };
    }

    throw error;
  }
}

export async function updatePasco(
  pascoId: string,
  input: PascoUpdateInput,
): Promise<
  | { success: true; pasco: Pasco }
  | {
      success: false;
      error: "not_found" | "invalid_solution_completeness_for_content_type";
    }
> {
  const existing = await prisma.pasco.findUnique({ where: { id: pascoId } });

  if (!existing) {
    return { success: false, error: "not_found" };
  }

  if (!validateUpdateSolutionCompleteness(existing, input)) {
    return {
      success: false,
      error: "invalid_solution_completeness_for_content_type",
    };
  }

  const pasco = await prisma.pasco.update({
    where: { id: pascoId },
    data: {
      ...(input.academicYear !== undefined && {
        academicYear: input.academicYear,
      }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.educationLevel !== undefined && {
        educationLevel: input.educationLevel,
      }),
      ...(input.semesterType !== undefined && {
        semesterType: input.semesterType,
      }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.contentType !== undefined && {
        contentType: input.contentType,
      }),
      ...(input.solutionCompleteness !== undefined && {
        solutionCompleteness: input.solutionCompleteness,
      }),
      ...(input.isComplete !== undefined && { isComplete: input.isComplete }),
    },
  });

  return { success: true, pasco };
}

export async function deletePasco(
  pascoId: string,
): Promise<{ success: true } | { success: false; error: "not_found" }> {
  const existing = await prisma.pasco.findUnique({ where: { id: pascoId } });

  if (!existing) {
    return { success: false, error: "not_found" };
  }

  await prisma.pasco.delete({ where: { id: pascoId } });

  return { success: true };
}
