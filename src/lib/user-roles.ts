import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import type { User } from "../../generated/prisma/client";
import { UserRole } from "../../generated/prisma/enums";

type UpgradeError = "not_found" | "already_upgraded" | "forbidden";

type PromoteError =
  | "actor_not_found"
  | "forbidden"
  | "target_not_found"
  | "already_moderator"
  | "invalid_target_role";

export async function upgradeUserToContributor(
  userId: string,
): Promise<
  { success: true; user: User } | { success: false; error: UpgradeError }
> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return { success: false, error: "not_found" };
  }

  if (user.role === UserRole.CONTRIBUTOR) {
    return { success: false, error: "already_upgraded" };
  }

  if (user.role !== UserRole.NORMAL_USER) {
    return { success: false, error: "forbidden" };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: UserRole.CONTRIBUTOR },
  });

  return { success: true, user: updated };
}

export async function promoteUserToModerator(
  actorUserId: string,
  targetUserId: string,
): Promise<
  { success: true; user: User } | { success: false; error: PromoteError }
> {
  const actorResult = await requireAdmin(actorUserId);

  if (!actorResult.success) {
    return {
      success: false,
      error:
        actorResult.error === "not_found" ? "actor_not_found" : "forbidden",
    };
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });

  if (!target) {
    return { success: false, error: "target_not_found" };
  }

  if (target.role === UserRole.MODERATOR) {
    return { success: false, error: "already_moderator" };
  }

  if (target.role === UserRole.ADMIN) {
    return { success: false, error: "invalid_target_role" };
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: UserRole.MODERATOR },
  });

  return { success: true, user: updated };
}
