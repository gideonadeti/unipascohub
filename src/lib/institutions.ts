import { prisma } from "@/lib/db";
import type { Institution } from "../../generated/prisma/client";
import { Prisma } from "../../generated/prisma/client";

const MAX_NAME_LENGTH = 200;

export type InstitutionInput = {
  name: string;
};

type InstitutionError = "not_found" | "duplicate_name" | "has_programs";

type InstitutionParseError = "invalid_body" | "invalid_name";

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

export function parseInstitutionCreate(
  body: unknown,
):
  | { success: true; data: InstitutionInput }
  | { success: false; error: InstitutionParseError } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "invalid_body" };
  }

  const record = body as Record<string, unknown>;

  if (!("name" in record)) {
    return { success: false, error: "invalid_body" };
  }

  const name = parseName(record.name);

  if (name === null) {
    return { success: false, error: "invalid_name" };
  }

  return { success: true, data: { name } };
}

export function parseInstitutionUpdate(
  body: unknown,
):
  | { success: true; data: InstitutionInput }
  | { success: false; error: InstitutionParseError } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "invalid_body" };
  }

  const record = body as Record<string, unknown>;

  if (!("name" in record)) {
    return { success: false, error: "invalid_body" };
  }

  const name = parseName(record.name);

  if (name === null) {
    return { success: false, error: "invalid_name" };
  }

  return { success: true, data: { name } };
}

export function serializeInstitution(institution: Institution) {
  return {
    id: institution.id,
    name: institution.name,
    createdAt: institution.createdAt.toISOString(),
    updatedAt: institution.updatedAt.toISOString(),
  };
}

function isDuplicateNameError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function listInstitutions(): Promise<
  { success: true; institutions: Institution[] } | { success: false }
> {
  const institutions = await prisma.institution.findMany({
    orderBy: { name: "asc" },
  });

  return { success: true, institutions };
}

export async function getInstitutionById(
  id: string,
): Promise<
  | { success: true; institution: Institution }
  | { success: false; error: InstitutionError }
> {
  const institution = await prisma.institution.findUnique({ where: { id } });

  if (!institution) {
    return { success: false, error: "not_found" };
  }

  return { success: true, institution };
}

export async function createInstitution(
  input: InstitutionInput,
): Promise<
  | { success: true; institution: Institution }
  | { success: false; error: "duplicate_name" }
> {
  try {
    const institution = await prisma.institution.create({
      data: { name: input.name },
    });

    return { success: true, institution };
  } catch (error) {
    if (isDuplicateNameError(error)) {
      return { success: false, error: "duplicate_name" };
    }

    throw error;
  }
}

export async function updateInstitution(
  id: string,
  input: InstitutionInput,
): Promise<
  | { success: true; institution: Institution }
  | { success: false; error: InstitutionError }
> {
  const existing = await prisma.institution.findUnique({ where: { id } });

  if (!existing) {
    return { success: false, error: "not_found" };
  }

  try {
    const institution = await prisma.institution.update({
      where: { id },
      data: { name: input.name },
    });

    return { success: true, institution };
  } catch (error) {
    if (isDuplicateNameError(error)) {
      return { success: false, error: "duplicate_name" };
    }

    throw error;
  }
}

export async function deleteInstitution(
  id: string,
): Promise<{ success: true } | { success: false; error: InstitutionError }> {
  const existing = await prisma.institution.findUnique({
    where: { id },
    include: { _count: { select: { programs: true } } },
  });

  if (!existing) {
    return { success: false, error: "not_found" };
  }

  if (existing._count.programs > 0) {
    return { success: false, error: "has_programs" };
  }

  await prisma.institution.delete({ where: { id } });

  return { success: true };
}
