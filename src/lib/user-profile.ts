import { prisma } from "@/lib/db";
import type { User } from "../../generated/prisma/client";
import {
  EducationLevel,
  type EducationLevel as EducationLevelType,
} from "../../generated/prisma/enums";

const EDUCATION_LEVELS = new Set<string>(Object.values(EducationLevel));
const MAX_SCHOOL_LENGTH = 200;

export type ProfileUpdateInput = {
  school?: string | null;
  educationLevel?: EducationLevelType | null;
};

type ProfileError = "not_found";

type ProfileUpdateError =
  | ProfileError
  | "invalid_body"
  | "invalid_school"
  | "invalid_education_level";

function isEducationLevel(value: string): value is EducationLevelType {
  return EDUCATION_LEVELS.has(value);
}

export function parseProfileUpdate(
  body: unknown,
):
  | { success: true; data: ProfileUpdateInput }
  | { success: false; error: Exclude<ProfileUpdateError, "not_found"> } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "invalid_body" };
  }

  const record = body as Record<string, unknown>;
  const data: ProfileUpdateInput = {};
  let hasUpdate = false;

  if ("school" in record) {
    hasUpdate = true;

    if (record.school === null) {
      data.school = null;
    } else if (typeof record.school !== "string") {
      return { success: false, error: "invalid_school" };
    } else {
      const school = record.school.trim();

      if (school.length === 0 || school.length > MAX_SCHOOL_LENGTH) {
        return { success: false, error: "invalid_school" };
      }

      data.school = school;
    }
  }

  if ("educationLevel" in record) {
    hasUpdate = true;

    if (record.educationLevel === null) {
      data.educationLevel = null;
    } else if (
      typeof record.educationLevel !== "string" ||
      !isEducationLevel(record.educationLevel)
    ) {
      return { success: false, error: "invalid_education_level" };
    } else {
      data.educationLevel = record.educationLevel;
    }
  }

  if (!hasUpdate) {
    return { success: false, error: "invalid_body" };
  }

  return { success: true, data };
}

export function serializeProfileUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    school: user.school,
    educationLevel: user.educationLevel,
    role: user.role,
  };
}

export async function getUserProfile(
  clerkId: string,
): Promise<
  { success: true; user: User } | { success: false; error: ProfileError }
> {
  const user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    return { success: false, error: "not_found" };
  }

  return { success: true, user };
}

export async function updateUserProfile(
  clerkId: string,
  input: ProfileUpdateInput,
): Promise<
  { success: true; user: User } | { success: false; error: ProfileError }
> {
  const user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    return { success: false, error: "not_found" };
  }

  const updated = await prisma.user.update({
    where: { clerkId },
    data: {
      ...(input.school !== undefined && { school: input.school }),
      ...(input.educationLevel !== undefined && {
        educationLevel: input.educationLevel,
      }),
    },
  });

  return { success: true, user: updated };
}
