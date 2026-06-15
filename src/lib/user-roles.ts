import { prisma } from "@/lib/db";
import type { User } from "../../generated/prisma/client";
import { Role } from "../../generated/prisma/enums";

type UpgradeError = "not_found" | "already_upgraded" | "forbidden";

type PromoteError =
  | "actor_not_found"
  | "forbidden"
  | "target_not_found"
  | "already_moderator"
  | "invalid_target_role";

export async function upgradeUserToContributor(
  clerkId: string,
): Promise<
  { success: true; user: User } | { success: false; error: UpgradeError }
> {
  const user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    return { success: false, error: "not_found" };
  }

  if (user.role === Role.CONTRIBUTOR) {
    return { success: false, error: "already_upgraded" };
  }

  if (user.role !== Role.NORMAL_USER) {
    return { success: false, error: "forbidden" };
  }

  const updated = await prisma.user.update({
    where: { clerkId },
    data: { role: Role.CONTRIBUTOR },
  });

  return { success: true, user: updated };
}

export async function promoteUserToModerator(
  actorClerkId: string,
  targetUserId: string,
): Promise<
  { success: true; user: User } | { success: false; error: PromoteError }
> {
  const actor = await prisma.user.findUnique({
    where: { clerkId: actorClerkId },
  });

  if (!actor) {
    return { success: false, error: "actor_not_found" };
  }

  if (actor.role !== Role.ADMIN) {
    return { success: false, error: "forbidden" };
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });

  if (!target) {
    return { success: false, error: "target_not_found" };
  }

  if (target.role === Role.MODERATOR) {
    return { success: false, error: "already_moderator" };
  }

  if (target.role === Role.ADMIN) {
    return { success: false, error: "invalid_target_role" };
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: Role.MODERATOR },
  });

  return { success: true, user: updated };
}
