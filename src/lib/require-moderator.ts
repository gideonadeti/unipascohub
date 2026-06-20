import { prisma } from "@/lib/db";
import type { User } from "../../generated/prisma/client";
import { UserRole } from "../../generated/prisma/enums";

type RequireModeratorError = "not_found" | "forbidden";

const MODERATOR_ROLES = new Set<UserRole>([UserRole.MODERATOR, UserRole.ADMIN]);

export async function requireModerator(
  userId: string,
): Promise<
  | { success: true; user: User }
  | { success: false; error: RequireModeratorError }
> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return { success: false, error: "not_found" };
  }

  if (!MODERATOR_ROLES.has(user.role)) {
    return { success: false, error: "forbidden" };
  }

  return { success: true, user };
}
