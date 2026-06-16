import { prisma } from "@/lib/db";
import type { Program } from "../../generated/prisma/client";
import { Prisma } from "../../generated/prisma/client";
import {
  ProgramType,
  type ProgramType as ProgramTypeType,
} from "../../generated/prisma/enums";

const MAX_NAME_LENGTH = 200;

const PROGRAM_TYPES = new Set<string>(Object.values(ProgramType));

export type ProgramCreateInput = {
  institutionId: string;
  name: string;
  type: ProgramTypeType;
};

export type ProgramUpdateInput = {
  name?: string;
  type?: ProgramTypeType;
};

type ProgramError =
  | "not_found"
  | "institution_not_found"
  | "duplicate_name_and_type"
  | "has_courses";

type ProgramParseError =
  | "invalid_body"
  | "invalid_institution_id"
  | "invalid_name"
  | "invalid_type";

function parseName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const name = value.trim();

  if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
    return null;
  }

  return name;
}

function parseInstitutionId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const institutionId = value.trim();

  if (institutionId.length === 0) {
    return null;
  }

  return institutionId;
}

function isProgramType(value: string): value is ProgramTypeType {
  return PROGRAM_TYPES.has(value);
}

export function parseProgramCreate(
  body: unknown,
):
  | { success: true; data: ProgramCreateInput }
  | { success: false; error: ProgramParseError } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "invalid_body" };
  }

  const record = body as Record<string, unknown>;

  if (
    !("institutionId" in record) ||
    !("name" in record) ||
    !("type" in record)
  ) {
    return { success: false, error: "invalid_body" };
  }

  const institutionId = parseInstitutionId(record.institutionId);
  const name = parseName(record.name);
  const typeValue = record.type;

  if (institutionId === null) {
    return { success: false, error: "invalid_institution_id" };
  }

  if (name === null) {
    return { success: false, error: "invalid_name" };
  }

  if (typeof typeValue !== "string" || !isProgramType(typeValue)) {
    return { success: false, error: "invalid_type" };
  }

  return { success: true, data: { institutionId, name, type: typeValue } };
}

export function parseProgramUpdate(body: unknown):
  | { success: true; data: ProgramUpdateInput }
  | {
      success: false;
      error: "invalid_body" | "invalid_name" | "invalid_type";
    } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "invalid_body" };
  }

  const record = body as Record<string, unknown>;
  const data: ProgramUpdateInput = {};
  let hasUpdate = false;

  if ("name" in record) {
    hasUpdate = true;

    const name = parseName(record.name);
    if (name === null) {
      return { success: false, error: "invalid_name" };
    }

    data.name = name;
  }

  if ("type" in record) {
    hasUpdate = true;

    const typeValue = record.type;
    if (typeof typeValue !== "string" || !isProgramType(typeValue)) {
      return { success: false, error: "invalid_type" };
    }

    data.type = typeValue;
  }

  if (!hasUpdate) {
    return { success: false, error: "invalid_body" };
  }

  return { success: true, data };
}

export function serializeProgram(program: Program) {
  return {
    id: program.id,
    institutionId: program.institutionId,
    name: program.name,
    type: program.type,
    createdAt: program.createdAt.toISOString(),
    updatedAt: program.updatedAt.toISOString(),
  };
}

function isDuplicateNameAndTypeError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function listPrograms(params?: {
  institutionId?: string;
}): Promise<{ success: true; programs: Program[] } | { success: false }> {
  const institutionId = params?.institutionId;

  const programs = await prisma.program.findMany({
    where: institutionId ? { institutionId } : undefined,
    orderBy: { name: "asc" },
  });

  return { success: true, programs };
}

export async function getProgramById(
  programId: string,
): Promise<
  { success: true; program: Program } | { success: false; error: ProgramError }
> {
  const program = await prisma.program.findUnique({ where: { id: programId } });

  if (!program) {
    return { success: false, error: "not_found" };
  }

  return { success: true, program };
}

export async function createProgram(input: ProgramCreateInput): Promise<
  | { success: true; program: Program }
  | {
      success: false;
      error: "institution_not_found" | "duplicate_name_and_type";
    }
> {
  const institution = await prisma.institution.findUnique({
    where: { id: input.institutionId },
  });

  if (!institution) {
    return { success: false, error: "institution_not_found" };
  }

  try {
    const program = await prisma.program.create({
      data: {
        institutionId: input.institutionId,
        name: input.name,
        type: input.type,
      },
    });

    return { success: true, program };
  } catch (error) {
    if (isDuplicateNameAndTypeError(error)) {
      return { success: false, error: "duplicate_name_and_type" };
    }

    throw error;
  }
}

export async function updateProgram(
  programId: string,
  input: ProgramUpdateInput,
): Promise<
  | { success: true; program: Program }
  | { success: false; error: "not_found" | "duplicate_name_and_type" }
> {
  const existing = await prisma.program.findUnique({
    where: { id: programId },
  });

  if (!existing) {
    return { success: false, error: "not_found" };
  }

  try {
    const program = await prisma.program.update({
      where: { id: programId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.type !== undefined && { type: input.type }),
      },
    });

    return { success: true, program };
  } catch (error) {
    if (isDuplicateNameAndTypeError(error)) {
      return { success: false, error: "duplicate_name_and_type" };
    }

    throw error;
  }
}

export async function deleteProgram(
  programId: string,
): Promise<
  { success: true } | { success: false; error: "not_found" | "has_courses" }
> {
  const existing = await prisma.program.findUnique({
    where: { id: programId },
    include: { _count: { select: { courses: true } } },
  });

  if (!existing) {
    return { success: false, error: "not_found" };
  }

  if (existing._count.courses > 0) {
    return { success: false, error: "has_courses" };
  }

  await prisma.program.delete({ where: { id: programId } });

  return { success: true };
}
