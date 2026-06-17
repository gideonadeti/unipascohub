import { academicYearValidationMessage } from "@/lib/academic-year";
import {
  deleteCloudinaryAssets,
  type VerifyFileError,
  validatePdfResourceType,
  verifyCloudinaryFile,
} from "@/lib/cloudinary";
import { prisma } from "@/lib/db";
import type { Pasco, PascoFile } from "../../generated/prisma/client";
import { Prisma } from "../../generated/prisma/client";
import {
  CloudinaryResourceType,
  type CloudinaryResourceType as CloudinaryResourceTypeType,
  EducationLevel,
  type EducationLevel as EducationLevelType,
  PascoContentType,
  type PascoContentType as PascoContentTypeType,
  type PascoReactionType as PascoReactionTypeValue,
  PascoType,
  type PascoType as PascoTypeType,
  SemesterType,
  type SemesterType as SemesterTypeType,
  SolutionCompleteness,
  type SolutionCompleteness as SolutionCompletenessType,
} from "../../generated/prisma/enums";

const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_FILE_NAME_LENGTH = 255;
const MAX_PUBLIC_ID_LENGTH = 500;
const MAX_FILE_URL_LENGTH = 2000;
const DEFAULT_LIST_PAGE = 1;
const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 100;

const EXISTING_FILE_SYNC_KEYS = new Set(["id", "order"]);
const LIST_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "academicYear",
  "likeCount",
  "dislikeCount",
  "downloadCount",
  "viewCount",
] as const;

type PascoListSortBy = (typeof LIST_SORT_FIELDS)[number];
type PascoListSortOrder = "asc" | "desc";

const EDUCATION_LEVELS = new Set<string>(Object.values(EducationLevel));
const SEMESTER_TYPES = new Set<string>(Object.values(SemesterType));
const PASCO_TYPES = new Set<string>(Object.values(PascoType));
const PASCO_CONTENT_TYPES = new Set<string>(Object.values(PascoContentType));
const CLOUDINARY_RESOURCE_TYPES = new Set<string>(
  Object.values(CloudinaryResourceType),
);
const SOLUTION_COMPLETENESS_VALUES = new Set<string>(
  Object.values(SolutionCompleteness),
);

export type PascoCreateInput = {
  courseId: string;
  files: PascoFileCreateInput[];
  academicYear: string;
  description?: string;
  educationLevel: EducationLevelType;
  semesterType: SemesterTypeType;
  type: PascoTypeType;
  contentType: PascoContentTypeType;
  solutionCompleteness?: SolutionCompletenessType | null;
  isComplete?: boolean;
};

export type PascoFileCreateInput = {
  order: number;
  publicId: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  resourceType: CloudinaryResourceTypeType;
};

export type PascoFileExistingSyncInput = {
  id: string;
  order: number;
};

export type PascoFileSyncInput =
  | PascoFileCreateInput
  | PascoFileExistingSyncInput;

export type PascoUpdateInput = {
  academicYear?: string;
  description?: string | null;
  educationLevel?: EducationLevelType;
  semesterType?: SemesterTypeType;
  type?: PascoTypeType;
  contentType?: PascoContentTypeType;
  solutionCompleteness?: SolutionCompletenessType | null;
  isComplete?: boolean;
  files?: PascoFileSyncInput[];
};

export type PascoWithFiles = Pasco & { files: PascoFile[] };

export type PascoListQuery = {
  courseId?: string;
  educationLevel?: EducationLevelType;
  academicYear?: string;
  semesterType?: SemesterTypeType;
  type?: PascoTypeType;
  contentType?: PascoContentTypeType;
  isComplete?: boolean;
  page: number;
  limit: number;
  sortBy: PascoListSortBy;
  sortOrder: PascoListSortOrder;
};

export type PascoListParseError =
  | "invalid_education_level"
  | "invalid_semester_type"
  | "invalid_type"
  | "invalid_content_type"
  | "invalid_academic_year"
  | "invalid_is_complete"
  | "invalid_page"
  | "invalid_limit"
  | "invalid_sort_by"
  | "invalid_sort_order";

type PascoError = "not_found" | "course_not_found" | "duplicate_public_id";

type PascoCreateParseError =
  | "invalid_body"
  | "invalid_course_id"
  | "invalid_files"
  | "invalid_file_order"
  | "invalid_public_id"
  | "invalid_file_name"
  | "invalid_file_size"
  | "invalid_file_url"
  | "invalid_resource_type"
  | "invalid_pdf_resource_type"
  | "invalid_academic_year"
  | "invalid_description"
  | "invalid_education_level"
  | "invalid_semester_type"
  | "invalid_type"
  | "invalid_content_type"
  | "invalid_is_complete"
  | "invalid_solution_completeness"
  | "invalid_solution_completeness_for_content_type"
  | "duplicate_order_in_files"
  | "too_many_files"
  | "file_size_exceeded";

type PascoUpdateParseError =
  | "invalid_body"
  | "invalid_academic_year"
  | "invalid_description"
  | "invalid_education_level"
  | "invalid_semester_type"
  | "invalid_type"
  | "invalid_content_type"
  | "invalid_is_complete"
  | "invalid_solution_completeness"
  | "invalid_files"
  | "invalid_file_order"
  | "invalid_public_id"
  | "invalid_file_name"
  | "invalid_file_size"
  | "invalid_file_url"
  | "invalid_resource_type"
  | "invalid_pdf_resource_type"
  | "duplicate_order_in_files"
  | "conflicting_file_update"
  | "invalid_file_id"
  | "duplicate_file_id_in_payload"
  | "invalid_existing_file_payload"
  | "too_many_files"
  | "file_size_exceeded";

type PascoFileSyncError =
  | "unknown_file_id"
  | VerifyFileError
  | "duplicate_public_id"
  | "too_many_files";

const pascoInclude = {
  files: { orderBy: { order: "asc" as const } },
} satisfies Prisma.PascoInclude;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function getPascoMaxFilesPerPasco(): number {
  return parsePositiveInt(process.env.PASCO_MAX_FILES_PER_PASCO, 20);
}

export function getPascoMaxFileSizeBytes(): number {
  return parsePositiveInt(process.env.PASCO_MAX_FILE_SIZE_BYTES, 20_971_520);
}

function isFileSizeWithinPolicy(fileSize: number): boolean {
  return fileSize <= getPascoMaxFileSizeBytes();
}

function isPascoListSortBy(value: string): value is PascoListSortBy {
  return (LIST_SORT_FIELDS as readonly string[]).includes(value);
}

function isPascoListSortOrder(value: string): value is PascoListSortOrder {
  return value === "asc" || value === "desc";
}

export function parseListPascosQuery(
  searchParams: URLSearchParams,
):
  | { success: true; data: PascoListQuery }
  | { success: false; error: PascoListParseError } {
  const courseIdParam = searchParams.get("courseId");
  const educationLevelParam = searchParams.get("educationLevel");
  const academicYearParam = searchParams.get("academicYear");
  const semesterTypeParam = searchParams.get("semesterType");
  const typeParam = searchParams.get("type");
  const contentTypeParam = searchParams.get("contentType");
  const isCompleteParam = searchParams.get("isComplete");
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const sortByParam = searchParams.get("sortBy");
  const sortOrderParam = searchParams.get("sortOrder");

  if (
    educationLevelParam !== null &&
    !EDUCATION_LEVELS.has(educationLevelParam)
  ) {
    return { success: false, error: "invalid_education_level" };
  }

  if (semesterTypeParam !== null && !SEMESTER_TYPES.has(semesterTypeParam)) {
    return { success: false, error: "invalid_semester_type" };
  }

  if (typeParam !== null && !PASCO_TYPES.has(typeParam)) {
    return { success: false, error: "invalid_type" };
  }

  if (contentTypeParam !== null && !PASCO_CONTENT_TYPES.has(contentTypeParam)) {
    return { success: false, error: "invalid_content_type" };
  }

  let academicYear: string | undefined;
  if (academicYearParam !== null) {
    const parsedAcademicYear = parseAcademicYear(academicYearParam);
    if (parsedAcademicYear === null) {
      return { success: false, error: "invalid_academic_year" };
    }
    academicYear = parsedAcademicYear;
  }

  let isComplete: boolean | undefined;
  if (isCompleteParam !== null) {
    if (isCompleteParam === "true") {
      isComplete = true;
    } else if (isCompleteParam === "false") {
      isComplete = false;
    } else {
      return { success: false, error: "invalid_is_complete" };
    }
  }

  const page =
    pageParam === null ? DEFAULT_LIST_PAGE : Number.parseInt(pageParam, 10);
  if (!Number.isInteger(page) || page < 1) {
    return { success: false, error: "invalid_page" };
  }

  const limit =
    limitParam === null ? DEFAULT_LIST_LIMIT : Number.parseInt(limitParam, 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIST_LIMIT) {
    return { success: false, error: "invalid_limit" };
  }

  const sortBy =
    sortByParam === null || sortByParam.length === 0
      ? "createdAt"
      : sortByParam;
  if (!isPascoListSortBy(sortBy)) {
    return { success: false, error: "invalid_sort_by" };
  }

  const sortOrder =
    sortOrderParam === null || sortOrderParam.length === 0
      ? "desc"
      : sortOrderParam;
  if (!isPascoListSortOrder(sortOrder)) {
    return { success: false, error: "invalid_sort_order" };
  }

  return {
    success: true,
    data: {
      courseId: courseIdParam?.trim() || undefined,
      educationLevel:
        educationLevelParam !== null
          ? (educationLevelParam as EducationLevelType)
          : undefined,
      academicYear,
      semesterType:
        semesterTypeParam !== null
          ? (semesterTypeParam as SemesterTypeType)
          : undefined,
      type: typeParam !== null ? (typeParam as PascoTypeType) : undefined,
      contentType:
        contentTypeParam !== null
          ? (contentTypeParam as PascoContentTypeType)
          : undefined,
      isComplete,
      page,
      limit,
      sortBy,
      sortOrder,
    },
  };
}

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

function parseOrder(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

function isCloudinaryResourceType(
  value: string,
): value is CloudinaryResourceTypeType {
  return CLOUDINARY_RESOURCE_TYPES.has(value);
}

function isPascoFileExistingSyncInput(
  file: PascoFileSyncInput,
): file is PascoFileExistingSyncInput {
  return "id" in file;
}

function parsePascoFileCreate(value: unknown):
  | { success: true; data: PascoFileCreateInput }
  | {
      success: false;
      error:
        | "invalid_file_order"
        | "invalid_public_id"
        | "invalid_file_name"
        | "invalid_file_size"
        | "invalid_file_url"
        | "invalid_resource_type"
        | "invalid_pdf_resource_type"
        | "file_size_exceeded";
    } {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { success: false, error: "invalid_public_id" };
  }

  const record = value as Record<string, unknown>;

  const requiredFields = [
    "order",
    "publicId",
    "fileName",
    "fileSize",
    "fileUrl",
    "resourceType",
  ] as const;

  if (!requiredFields.every((field) => field in record)) {
    return { success: false, error: "invalid_public_id" };
  }

  const order = parseOrder(record.order);
  const publicId = parseNonEmptyString(record.publicId, MAX_PUBLIC_ID_LENGTH);
  const fileName = parseNonEmptyString(record.fileName, MAX_FILE_NAME_LENGTH);
  const fileSize = parseFileSize(record.fileSize);
  const fileUrl = parseNonEmptyString(record.fileUrl, MAX_FILE_URL_LENGTH);

  if (order === null) {
    return { success: false, error: "invalid_file_order" };
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

  if (!isFileSizeWithinPolicy(fileSize)) {
    return { success: false, error: "file_size_exceeded" };
  }

  if (fileUrl === null) {
    return { success: false, error: "invalid_file_url" };
  }

  if (
    typeof record.resourceType !== "string" ||
    !isCloudinaryResourceType(record.resourceType)
  ) {
    return { success: false, error: "invalid_resource_type" };
  }

  if (!validatePdfResourceType(fileName, record.resourceType)) {
    return { success: false, error: "invalid_pdf_resource_type" };
  }

  return {
    success: true,
    data: {
      order,
      publicId,
      fileName,
      fileSize,
      fileUrl,
      resourceType: record.resourceType,
    },
  };
}

function parsePascoFiles(value: unknown):
  | { success: true; data: PascoFileCreateInput[] }
  | {
      success: false;
      error:
        | "invalid_files"
        | "invalid_file_order"
        | "invalid_public_id"
        | "invalid_file_name"
        | "invalid_file_size"
        | "invalid_file_url"
        | "invalid_resource_type"
        | "invalid_pdf_resource_type"
        | "duplicate_order_in_files"
        | "too_many_files"
        | "file_size_exceeded";
    } {
  if (!Array.isArray(value) || value.length === 0) {
    return { success: false, error: "invalid_files" };
  }

  if (value.length > getPascoMaxFilesPerPasco()) {
    return { success: false, error: "too_many_files" };
  }

  const files: PascoFileCreateInput[] = [];
  const seenOrders = new Set<number>();

  for (const file of value) {
    const parsed = parsePascoFileCreate(file);

    if (!parsed.success) {
      return parsed;
    }

    if (seenOrders.has(parsed.data.order)) {
      return { success: false, error: "duplicate_order_in_files" };
    }

    seenOrders.add(parsed.data.order);
    files.push(parsed.data);
  }

  return { success: true, data: files };
}

function parsePascoFileId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const id = value.trim();

  if (id.length === 0) {
    return null;
  }

  return id;
}

function parsePascoFileSync(value: unknown):
  | { success: true; data: PascoFileSyncInput }
  | {
      success: false;
      error:
        | "invalid_file_id"
        | "invalid_file_order"
        | "invalid_existing_file_payload"
        | "invalid_public_id"
        | "invalid_file_name"
        | "invalid_file_size"
        | "invalid_file_url"
        | "invalid_resource_type"
        | "invalid_pdf_resource_type"
        | "file_size_exceeded";
    } {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { success: false, error: "invalid_public_id" };
  }

  const record = value as Record<string, unknown>;
  const hasId = "id" in record && record.id !== undefined && record.id !== null;

  if (hasId) {
    for (const key of Object.keys(record)) {
      if (!EXISTING_FILE_SYNC_KEYS.has(key)) {
        return { success: false, error: "invalid_existing_file_payload" };
      }
    }

    const id = parsePascoFileId(record.id);
    const order = parseOrder(record.order);

    if (id === null) {
      return { success: false, error: "invalid_file_id" };
    }

    if (order === null) {
      return { success: false, error: "invalid_file_order" };
    }

    return { success: true, data: { id, order } };
  }

  const parsed = parsePascoFileCreate(value);

  if (!parsed.success) {
    return parsed;
  }

  return { success: true, data: parsed.data };
}

function parsePascoFilesSync(value: unknown):
  | { success: true; data: PascoFileSyncInput[] }
  | {
      success: false;
      error:
        | "invalid_files"
        | "invalid_file_id"
        | "invalid_file_order"
        | "invalid_existing_file_payload"
        | "invalid_public_id"
        | "invalid_file_name"
        | "invalid_file_size"
        | "invalid_file_url"
        | "invalid_resource_type"
        | "invalid_pdf_resource_type"
        | "duplicate_order_in_files"
        | "duplicate_file_id_in_payload"
        | "too_many_files"
        | "file_size_exceeded";
    } {
  if (!Array.isArray(value) || value.length === 0) {
    return { success: false, error: "invalid_files" };
  }

  if (value.length > getPascoMaxFilesPerPasco()) {
    return { success: false, error: "too_many_files" };
  }

  const files: PascoFileSyncInput[] = [];
  const seenOrders = new Set<number>();
  const seenIds = new Set<string>();

  for (const file of value) {
    const parsed = parsePascoFileSync(file);

    if (!parsed.success) {
      return parsed;
    }

    if (seenOrders.has(parsed.data.order)) {
      return { success: false, error: "duplicate_order_in_files" };
    }

    seenOrders.add(parsed.data.order);

    if (isPascoFileExistingSyncInput(parsed.data)) {
      if (seenIds.has(parsed.data.id)) {
        return { success: false, error: "duplicate_file_id_in_payload" };
      }

      seenIds.add(parsed.data.id);
    }

    files.push(parsed.data);
  }

  return { success: true, data: files };
}

function parseAcademicYear(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const academicYear = value.trim();

  if (academicYearValidationMessage(academicYear) !== null) {
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

function isInvalidDescriptionValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value !== "string") {
    return true;
  }

  return value.trim().length > MAX_DESCRIPTION_LENGTH;
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
    "files",
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
  const filesResult = parsePascoFiles(record.files);
  const academicYear = parseAcademicYear(record.academicYear);

  if (courseId === null) {
    return { success: false, error: "invalid_course_id" };
  }

  if (!filesResult.success) {
    return filesResult;
  }

  if (academicYear === null) {
    return { success: false, error: "invalid_academic_year" };
  }

  if (isInvalidDescriptionValue(record.description)) {
    return { success: false, error: "invalid_description" };
  }

  const description = parseDescription(record.description);

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
      files: filesResult.data,
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
    if (isInvalidDescriptionValue(record.description)) {
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

  if ("addFiles" in record) {
    return { success: false, error: "conflicting_file_update" };
  }

  if ("files" in record) {
    hasUpdate = true;

    const filesResult = parsePascoFilesSync(record.files);

    if (!filesResult.success) {
      return filesResult;
    }

    data.files = filesResult.data;
  }

  if (!hasUpdate) {
    return { success: false, error: "invalid_body" };
  }

  return { success: true, data };
}

function serializePascoFile(file: PascoFile) {
  return {
    id: file.id,
    pascoId: file.pascoId,
    order: file.order,
    fileName: file.fileName,
    fileSize: file.fileSize,
    fileUrl: file.fileUrl,
    resourceType: file.resourceType,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
  };
}

export function serializePasco(
  pasco: PascoWithFiles,
  options?: {
    viewerReaction?: PascoReactionTypeValue | null;
  },
) {
  const serialized = {
    id: pasco.id,
    courseId: pasco.courseId,
    uploaderId: pasco.uploaderId,
    academicYear: pasco.academicYear,
    description: pasco.description,
    educationLevel: pasco.educationLevel,
    semesterType: pasco.semesterType,
    type: pasco.type,
    contentType: pasco.contentType,
    solutionCompleteness: pasco.solutionCompleteness,
    isComplete: pasco.isComplete,
    likeCount: pasco.likeCount,
    dislikeCount: pasco.dislikeCount,
    downloadCount: pasco.downloadCount,
    viewCount: pasco.viewCount,
    files: pasco.files.map(serializePascoFile),
    createdAt: pasco.createdAt.toISOString(),
    updatedAt: pasco.updatedAt.toISOString(),
  };

  if (options && "viewerReaction" in options) {
    return {
      ...serialized,
      viewerReaction: options.viewerReaction ?? null,
    };
  }

  return serialized;
}

export type SerializedPasco = ReturnType<typeof serializePasco>;

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

async function syncPascoFiles(
  pascoId: string,
  existing: PascoWithFiles,
  inputFiles: PascoFileSyncInput[],
): Promise<
  | { success: true; pasco: PascoWithFiles; storageCleanupFailures?: string[] }
  | {
      success: false;
      error: PascoFileSyncError;
    }
> {
  const existingById = new Map(existing.files.map((file) => [file.id, file]));
  const toAdd: PascoFileCreateInput[] = [];
  const toKeep: PascoFileExistingSyncInput[] = [];

  for (const file of inputFiles) {
    if (isPascoFileExistingSyncInput(file)) {
      if (existingById.get(file.id) === undefined) {
        return { success: false, error: "unknown_file_id" };
      }

      toKeep.push(file);
      continue;
    }

    toAdd.push(file);
  }

  if (inputFiles.length > getPascoMaxFilesPerPasco()) {
    return { success: false, error: "too_many_files" };
  }

  const keptIds = new Set(toKeep.map((file) => file.id));
  const toDelete = existing.files.filter((file) => !keptIds.has(file.id));
  const storageDeleteTargets = toDelete.map((file) => ({
    publicId: file.publicId,
    resourceType: file.resourceType,
  }));

  const expectedAssetFolder = `pascos/${existing.courseId}`;
  const verificationResults = await Promise.all(
    toAdd.map((file) =>
      verifyCloudinaryFile({
        publicId: file.publicId,
        fileUrl: file.fileUrl,
        fileSize: file.fileSize,
        resourceType: file.resourceType,
        expectedAssetFolder,
      }),
    ),
  );

  for (const result of verificationResults) {
    if (!result.success) {
      return { success: false, error: result.error };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const [index, file] of toKeep.entries()) {
        await tx.pascoFile.update({
          where: { id: file.id },
          data: { order: -(index + 1) },
        });
      }

      if (toDelete.length > 0) {
        await tx.pascoFile.deleteMany({
          where: {
            id: { in: toDelete.map((file) => file.id) },
          },
        });
      }

      for (const file of toKeep) {
        await tx.pascoFile.update({
          where: { id: file.id },
          data: { order: file.order },
        });
      }

      if (toAdd.length > 0) {
        await tx.pascoFile.createMany({
          data: toAdd.map((file) => ({
            pascoId,
            order: file.order,
            publicId: file.publicId,
            fileName: file.fileName,
            fileSize: file.fileSize,
            fileUrl: file.fileUrl,
            resourceType: file.resourceType,
          })),
        });
      }
    });
  } catch (error) {
    if (isDuplicatePublicIdError(error)) {
      return { success: false, error: "duplicate_public_id" };
    }

    throw error;
  }

  const pasco = await prisma.pasco.findUniqueOrThrow({
    where: { id: pascoId },
    include: pascoInclude,
  });

  if (storageDeleteTargets.length === 0) {
    return { success: true, pasco };
  }

  const cloudinaryResult = await deleteCloudinaryAssets(storageDeleteTargets);

  if (!cloudinaryResult.success) {
    return {
      success: true,
      pasco,
      storageCleanupFailures: cloudinaryResult.failedPublicIds,
    };
  }

  return { success: true, pasco };
}

export async function listPascos(params: PascoListQuery): Promise<
  | {
      success: true;
      pascos: PascoWithFiles[];
      total: number;
      page: number;
      limit: number;
    }
  | { success: false }
> {
  const where = {
    ...(params.courseId ? { courseId: params.courseId } : {}),
    ...(params.educationLevel ? { educationLevel: params.educationLevel } : {}),
    ...(params.academicYear ? { academicYear: params.academicYear } : {}),
    ...(params.semesterType ? { semesterType: params.semesterType } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.contentType ? { contentType: params.contentType } : {}),
    ...(params.isComplete !== undefined
      ? { isComplete: params.isComplete }
      : {}),
  };

  const orderBy = {
    [params.sortBy]: params.sortOrder,
  } as Prisma.PascoOrderByWithRelationInput;
  const skip = (params.page - 1) * params.limit;

  const [total, pascos] = await Promise.all([
    prisma.pasco.count({ where }),
    prisma.pasco.findMany({
      where,
      include: pascoInclude,
      orderBy,
      skip,
      take: params.limit,
    }),
  ]);

  return {
    success: true,
    pascos,
    total,
    page: params.page,
    limit: params.limit,
  };
}

export async function getPascoById(
  pascoId: string,
): Promise<
  | { success: true; pasco: PascoWithFiles }
  | { success: false; error: PascoError }
> {
  const pasco = await prisma.pasco.findUnique({
    where: { id: pascoId },
    include: pascoInclude,
  });

  if (!pasco) {
    return { success: false, error: "not_found" };
  }

  return { success: true, pasco };
}

export async function createPasco(
  input: PascoCreateInput,
  uploaderId: string,
): Promise<
  | { success: true; pasco: PascoWithFiles }
  | {
      success: false;
      error: "course_not_found" | "duplicate_public_id" | VerifyFileError;
    }
> {
  const course = await prisma.course.findUnique({
    where: { id: input.courseId },
  });

  if (!course) {
    return { success: false, error: "course_not_found" };
  }

  const expectedAssetFolder = `pascos/${input.courseId}`;
  const verificationResults = await Promise.all(
    input.files.map((file) =>
      verifyCloudinaryFile({
        publicId: file.publicId,
        fileUrl: file.fileUrl,
        fileSize: file.fileSize,
        resourceType: file.resourceType,
        expectedAssetFolder,
      }),
    ),
  );

  for (const result of verificationResults) {
    if (!result.success) {
      return { success: false, error: result.error };
    }
  }

  try {
    const pasco = await prisma.pasco.create({
      data: {
        courseId: input.courseId,
        uploaderId,
        academicYear: input.academicYear,
        description: input.description ?? null,
        educationLevel: input.educationLevel,
        semesterType: input.semesterType,
        type: input.type,
        contentType: input.contentType,
        solutionCompleteness: input.solutionCompleteness ?? null,
        isComplete: input.isComplete ?? true,
        files: {
          create: input.files.map((file) => ({
            order: file.order,
            publicId: file.publicId,
            fileName: file.fileName,
            fileSize: file.fileSize,
            fileUrl: file.fileUrl,
            resourceType: file.resourceType,
          })),
        },
      },
      include: pascoInclude,
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
  | { success: true; pasco: PascoWithFiles; storageCleanupFailures?: string[] }
  | {
      success: false;
      error:
        | "not_found"
        | "invalid_solution_completeness_for_content_type"
        | PascoFileSyncError;
    }
> {
  const existing = await prisma.pasco.findUnique({
    where: { id: pascoId },
    include: pascoInclude,
  });

  if (!existing) {
    return { success: false, error: "not_found" };
  }

  if (!validateUpdateSolutionCompleteness(existing, input)) {
    return {
      success: false,
      error: "invalid_solution_completeness_for_content_type",
    };
  }

  const hasMetadataUpdate =
    input.academicYear !== undefined ||
    input.description !== undefined ||
    input.educationLevel !== undefined ||
    input.semesterType !== undefined ||
    input.type !== undefined ||
    input.contentType !== undefined ||
    input.solutionCompleteness !== undefined ||
    input.isComplete !== undefined;

  if (hasMetadataUpdate) {
    await prisma.pasco.update({
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
  }

  if (input.files !== undefined) {
    const syncResult = await syncPascoFiles(pascoId, existing, input.files);

    if (!syncResult.success) {
      return { success: false, error: syncResult.error };
    }

    return {
      success: true,
      pasco: syncResult.pasco,
      ...(syncResult.storageCleanupFailures !== undefined && {
        storageCleanupFailures: syncResult.storageCleanupFailures,
      }),
    };
  }

  const pasco = await prisma.pasco.findUniqueOrThrow({
    where: { id: pascoId },
    include: pascoInclude,
  });

  return { success: true, pasco };
}

export async function deletePasco(
  pascoId: string,
): Promise<
  | { success: true; storageCleanupFailures?: string[] }
  | { success: false; error: "not_found" }
> {
  const existing = await prisma.pasco.findUnique({
    where: { id: pascoId },
    include: { files: true },
  });

  if (!existing) {
    return { success: false, error: "not_found" };
  }

  const storageDeleteTargets = existing.files.map((file) => ({
    publicId: file.publicId,
    resourceType: file.resourceType,
  }));

  await prisma.pasco.delete({ where: { id: pascoId } });

  if (storageDeleteTargets.length === 0) {
    return { success: true };
  }

  const cloudinaryResult = await deleteCloudinaryAssets(storageDeleteTargets);

  if (!cloudinaryResult.success) {
    return {
      success: true,
      storageCleanupFailures: cloudinaryResult.failedPublicIds,
    };
  }

  return { success: true };
}
