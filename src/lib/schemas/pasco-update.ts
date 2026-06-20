import * as z from "zod";
import {
  ACADEMIC_YEAR_OPTIONS,
  academicYearValidationMessage,
} from "@/lib/academic-year";
import {
  EDUCATION_LEVELS,
  PASCO_CONTENT_TYPES,
  PASCO_MAX_FILES,
  PASCO_TYPES,
  pascoFileCreateSchema,
  SEMESTER_TYPES,
  SOLUTION_COMPLETENESS_VALUES,
} from "@/lib/schemas/pasco-create";
import type {
  Pasco,
  PascoFileCreateInput,
  PascoFileSyncInput,
  PascoUpdateInput,
} from "@/types/api/pascos";

export const pascoFileExistingSchema = z.object({
  kind: z.literal("existing"),
  id: z.string().min(1),
  order: z.number().int().positive(),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  fileUrl: z.string().min(1).max(2000),
  resourceType: z.enum(["IMAGE", "RAW"]),
});

export const pascoFileNewSchema = pascoFileCreateSchema.extend({
  kind: z.literal("new"),
});

export const pascoEditFileSchema = z.discriminatedUnion("kind", [
  pascoFileExistingSchema,
  pascoFileNewSchema,
]);

export const pascoEditFormSchema = z
  .object({
    institutionId: z.string().min(1, "Select an institution"),
    programId: z.string(),
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
      .array(pascoEditFileSchema)
      .min(1, "At least one file is required")
      .max(PASCO_MAX_FILES, `You can have up to ${PASCO_MAX_FILES} files`),
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

    const newFiles = data.files.filter((file) => file.kind === "new");
    const contentHashes = newFiles.map((file) => file.contentHash);
    if (new Set(contentHashes).size !== contentHashes.length) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate files detected in this upload",
        path: ["files"],
      });
    }
  });

export type PascoEditFormValues = z.infer<typeof pascoEditFormSchema>;
export type PascoEditExistingFile = z.infer<typeof pascoFileExistingSchema>;
export type PascoEditNewFile = z.infer<typeof pascoFileNewSchema>;
export type PascoEditFile = z.infer<typeof pascoEditFileSchema>;

function renumberFiles(files: PascoEditFile[]): PascoEditFile[] {
  return files.map((file, index) => ({
    ...file,
    order: index + 1,
  }));
}

export function pascoToEditFormValues(
  pasco: Pasco,
  catalog: {
    institutionId: string;
    programId: string;
  },
): PascoEditFormValues {
  const sortedFiles = [...pasco.files].sort((a, b) => a.order - b.order);

  return {
    institutionId: catalog.institutionId,
    programId: catalog.programId,
    courseId: pasco.courseId,
    academicYear: pasco.academicYear,
    educationLevel: pasco.educationLevel,
    semesterType: pasco.semesterType,
    type: pasco.type,
    contentType: pasco.contentType,
    description: pasco.description ?? "",
    isComplete: pasco.isComplete,
    solutionCompleteness: pasco.solutionCompleteness,
    files: sortedFiles.map((file) => ({
      kind: "existing" as const,
      id: file.id,
      order: file.order,
      fileName: file.fileName,
      fileSize: file.fileSize,
      fileUrl: file.fileUrl,
      resourceType: file.resourceType,
    })),
  };
}

export function toPascoUpdateInput(
  values: PascoEditFormValues,
): PascoUpdateInput {
  const renumberedFiles = renumberFiles(values.files);
  const trimmedDescription = values.description.trim();

  const files: PascoFileSyncInput[] = renumberedFiles.map((file) => {
    if (file.kind === "existing") {
      return { id: file.id, order: file.order };
    }

    const { kind: _kind, ...createFields } = file;

    return createFields satisfies PascoFileCreateInput;
  });

  return {
    courseId: values.courseId,
    academicYear: values.academicYear,
    educationLevel: values.educationLevel,
    semesterType: values.semesterType,
    type: values.type,
    contentType: values.contentType,
    isComplete: values.isComplete,
    description: trimmedDescription.length > 0 ? trimmedDescription : null,
    solutionCompleteness:
      values.contentType === "QUESTIONS_ONLY"
        ? null
        : values.solutionCompleteness,
    files,
  };
}

export function keepExistingFilesOnly(files: PascoEditFile[]): PascoEditFile[] {
  return files.filter((file) => file.kind === "existing");
}

export function removeEditFile(
  files: PascoEditFile[],
  fileToRemove: PascoEditFile,
): PascoEditFile[] {
  const filtered = files.filter((file) => {
    if (file.kind === "existing" && fileToRemove.kind === "existing") {
      return file.id !== fileToRemove.id;
    }

    if (file.kind === "new" && fileToRemove.kind === "new") {
      return file.publicId !== fileToRemove.publicId;
    }

    return true;
  });

  return renumberFiles(filtered);
}

export function mergeNewUploads(
  existingFiles: PascoEditFile[],
  newUploads: PascoFileCreateInput[],
): PascoEditFile[] {
  const newFiles: PascoEditNewFile[] = newUploads.map((file) => ({
    kind: "new" as const,
    ...file,
  }));

  return renumberFiles([...existingFiles, ...newFiles]);
}

export function getNewUploadFiles(
  files: PascoEditFile[],
): PascoFileCreateInput[] {
  return files
    .filter((file): file is PascoEditNewFile => file.kind === "new")
    .map(({ kind: _kind, ...rest }) => rest);
}
