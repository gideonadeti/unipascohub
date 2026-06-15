import { prisma } from "@/lib/db";
import type { User } from "../../generated/prisma/client";
import { Role } from "../../generated/prisma/enums";

type UpgradeError = "not_found" | "already_upgraded" | "forbidden";

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
