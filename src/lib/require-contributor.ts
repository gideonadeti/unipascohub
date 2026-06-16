import { prisma } from "@/lib/db";
import type { Pasco, User } from "../../generated/prisma/client";
import { UserRole } from "../../generated/prisma/enums";

type RequireContributorError = "not_found" | "forbidden";

const CONTRIBUTOR_ROLES = new Set<UserRole>([
  UserRole.CONTRIBUTOR,
  UserRole.MODERATOR,
  UserRole.ADMIN,
]);

export async function requireContributor(
  userId: string,
): Promise<
  | { success: true; user: User }
  | { success: false; error: RequireContributorError }
> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return { success: false, error: "not_found" };
  }

  if (!CONTRIBUTOR_ROLES.has(user.role)) {
    return { success: false, error: "forbidden" };
  }

  return { success: true, user };
}

export async function canModifyPasco(
  actorUserId: string,
  pasco: Pasco,
): Promise<
  | { success: true; user: User }
  | { success: false; error: RequireContributorError }
> {
  const user = await prisma.user.findUnique({ where: { id: actorUserId } });

  if (!user) {
    return { success: false, error: "not_found" };
  }

  if (
    user.role === UserRole.MODERATOR ||
    user.role === UserRole.ADMIN ||
    pasco.uploaderId === actorUserId
  ) {
    return { success: true, user };
  }

  return { success: false, error: "forbidden" };
}
