import * as z from "zod";
import {
  ACADEMIC_YEAR_OPTIONS,
  academicYearValidationMessage,
} from "@/lib/academic-year";
import { getPascoFileTooLargeMessage } from "@/lib/pasco-file-types";
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
export const PASCO_MAX_FILE_SIZE_BYTES = 10_485_760;

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
      getPascoFileTooLargeMessage(PASCO_MAX_FILE_SIZE_BYTES),
    ),
  fileUrl: z.string().min(1).max(2000),
  resourceType: z.enum(CLOUDINARY_RESOURCE_TYPES),
});

export const pascoCreateFormSchema = z
  .object({
    institutionId: z.string().min(1, "Select an institution"),
    programId: z.string().min(1, "Select a program"),
    courseId: z.string().min(1, "Select a course"),
    academicYear: z.enum(
      ACADEMIC_YEAR_OPTIONS as [string, ...string[]],
      "Select an academic year",
    ),
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
    const academicYearError = academicYearValidationMessage(data.academicYear);
    if (academicYearError) {
      ctx.addIssue({
        code: "custom",
        message: academicYearError,
        path: ["academicYear"],
      });
    }

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
    description,
    ...rest
  } = values;

  const trimmedDescription = description.trim();

  return {
    ...rest,
    ...(trimmedDescription.length > 0
      ? { description: trimmedDescription }
      : {}),
    ...(rest.contentType === "QUESTIONS_ONLY"
      ? { solutionCompleteness: null }
      : {}),
  };
}
