import * as z from "zod";

import type {
  CloudinaryResourceType,
  EducationLevel,
  PascoContentType,
  PascoCreateInput,
  PascoType,
  SemesterType,
  SolutionCompleteness,
} from "@/types/api/pascos";

export const EDUCATION_LEVELS = [
  "LEVEL_100",
  "LEVEL_200",
  "LEVEL_300",
  "LEVEL_400",
] as const satisfies readonly EducationLevel[];

export const SEMESTER_TYPES = [
  "FIRST_SEMESTER",
  "SECOND_SEMESTER",
] as const satisfies readonly SemesterType[];

export const PASCO_TYPES = [
  "MID_SEM",
  "END_OF_SEM",
  "RESIT",
] as const satisfies readonly PascoType[];

export const PASCO_CONTENT_TYPES = [
  "QUESTIONS_ONLY",
  "QUESTIONS_AND_ANSWERS",
  "ANSWERS_ONLY",
] as const satisfies readonly PascoContentType[];

export const SOLUTION_COMPLETENESS_VALUES = [
  "FULLY_SOLVED",
  "PARTIALLY_SOLVED",
] as const satisfies readonly SolutionCompleteness[];

export const CLOUDINARY_RESOURCE_TYPES = [
  "IMAGE",
  "RAW",
] as const satisfies readonly CloudinaryResourceType[];

export const PASCO_MAX_FILES = 20;
export const PASCO_MAX_FILE_SIZE_BYTES = 20_971_520;

export const pascoFileCreateSchema = z.object({
  order: z.number().int().positive(),
  publicId: z.string().min(1).max(500),
  fileName: z.string().min(1).max(255),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(
      PASCO_MAX_FILE_SIZE_BYTES,
      `File must be ${Math.floor(PASCO_MAX_FILE_SIZE_BYTES / 1_048_576)} MB or less`,
    ),
  fileUrl: z.string().min(1).max(2000),
  resourceType: z.enum(CLOUDINARY_RESOURCE_TYPES),
});

function validateAcademicYear(
  value: string,
  ctx: z.RefinementCtx<Record<string, unknown>>,
) {
  const academicYear = value.trim();
  const match = /^(\d{4})\/(\d{4})$/.exec(academicYear);

  if (!match) {
    ctx.addIssue({
      code: "custom",
      message: "Use format YYYY/YYYY (e.g. 2024/2025)",
      path: ["academicYear"],
    });
    return;
  }

  const startYear = Number.parseInt(match[1], 10);
  const endYear = Number.parseInt(match[2], 10);

  if (endYear !== startYear + 1) {
    ctx.addIssue({
      code: "custom",
      message: "End year must be one year after the start year",
      path: ["academicYear"],
    });
  }
}

export const pascoCreateFormSchema = z
  .object({
    institutionId: z.string().min(1, "Select an institution"),
    programId: z.string().min(1, "Select a program"),
    courseId: z.string().min(1, "Select a course"),
    academicYear: z.string().min(1, "Academic year is required"),
    educationLevel: z.enum(EDUCATION_LEVELS),
    semesterType: z.enum(SEMESTER_TYPES),
    type: z.enum(PASCO_TYPES),
    contentType: z.enum(PASCO_CONTENT_TYPES),
    description: z
      .string()
      .max(1000, "Description must be 1000 characters or less"),
    isComplete: z.boolean(),
    solutionCompleteness: z.enum(SOLUTION_COMPLETENESS_VALUES).nullable(),
    files: z
      .array(pascoFileCreateSchema)
      .min(1, "Upload at least one file")
      .max(PASCO_MAX_FILES, `You can upload up to ${PASCO_MAX_FILES} files`),
  })
  .superRefine((data, ctx) => {
    validateAcademicYear(data.academicYear, ctx);

    if (data.contentType === "QUESTIONS_ONLY") {
      if (data.solutionCompleteness !== null) {
        ctx.addIssue({
          code: "custom",
          message: "Solution completeness is not allowed for questions only",
          path: ["solutionCompleteness"],
        });
      }
    } else if (data.solutionCompleteness === null) {
      ctx.addIssue({
        code: "custom",
        message: "Select solution completeness",
        path: ["solutionCompleteness"],
      });
    }

    const orders = data.files.map((file) => file.order);
    if (new Set(orders).size !== orders.length) {
      ctx.addIssue({
        code: "custom",
        message: "File orders must be unique",
        path: ["files"],
      });
    }
  });

export type PascoCreateFormValues = z.infer<typeof pascoCreateFormSchema>;
export type PascoFileCreateInput = z.infer<typeof pascoFileCreateSchema>;

export function toPascoCreateInput(
  values: PascoCreateFormValues,
): PascoCreateInput {
  const {
    institutionId: _institutionId,
    programId: _programId,
    ...rest
  } = values;

  const description = rest.description.trim();

  return {
    ...rest,
    ...(description.length > 0 ? { description } : {}),
    ...(rest.contentType === "QUESTIONS_ONLY"
      ? { solutionCompleteness: null }
      : {}),
  };
}
