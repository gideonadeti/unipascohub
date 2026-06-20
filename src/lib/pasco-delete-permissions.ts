import { prisma } from "@/lib/db";
import type { Pasco, User } from "../../generated/prisma/client";
import { UserRole } from "../../generated/prisma/enums";

type PascoDeleteError = "not_found" | "forbidden";

export async function canDeletePasco(
  actorUserId: string,
  pasco: Pick<Pasco, "uploaderId">,
): Promise<
  { success: true; user: User } | { success: false; error: PascoDeleteError }
> {
  const user = await prisma.user.findUnique({ where: { id: actorUserId } });

  if (!user) {
    return { success: false, error: "not_found" };
  }

  if (user.role === UserRole.ADMIN || pasco.uploaderId === actorUserId) {
    return { success: true, user };
  }

  return { success: false, error: "forbidden" };
}
