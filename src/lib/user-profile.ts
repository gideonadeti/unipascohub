import { prisma } from "@/lib/db";
import type { User } from "../../generated/prisma/client";

import { MAX_SCHOOL_LENGTH } from "./constants";

export type ProfileUpdateInput = {
  school?: string | null;
};

type ProfileError = "not_found";

type ProfileUpdateError = ProfileError | "invalid_body" | "invalid_school";

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
    role: user.role,
  };
}

export async function getUserProfile(
  userId: string,
): Promise<
  { success: true; user: User } | { success: false; error: ProfileError }
> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return { success: false, error: "not_found" };
  }

  return { success: true, user };
}

export async function updateUserProfile(
  userId: string,
  input: ProfileUpdateInput,
): Promise<
  { success: true; user: User } | { success: false; error: ProfileError }
> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return { success: false, error: "not_found" };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.school !== undefined && { school: input.school }),
    },
  });

  return { success: true, user: updated };
}
