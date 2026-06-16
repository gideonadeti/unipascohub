import { prisma } from "@/lib/db";
import type { User } from "../../generated/prisma/client";
import { UserRole } from "../../generated/prisma/enums";

type RequireAdminError = "not_found" | "forbidden";

export async function requireAdmin(
  userId: string,
): Promise<
  { success: true; user: User } | { success: false; error: RequireAdminError }
> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return { success: false, error: "not_found" };
  }

  if (user.role !== UserRole.ADMIN) {
    return { success: false, error: "forbidden" };
  }

  return { success: true, user };
}
