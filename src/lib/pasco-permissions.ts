import type { Pasco } from "@/types/api/pascos";
import type { ProfileUser } from "@/types/api/users";

const MODIFY_ROLES = new Set<ProfileUser["role"]>(["MODERATOR", "ADMIN"]);

export function canUserModifyPasco(
  user: Pick<ProfileUser, "id" | "role"> | null | undefined,
  pasco: Pick<Pasco, "uploaderId">,
): boolean {
  if (!user) {
    return false;
  }

  return MODIFY_ROLES.has(user.role) || pasco.uploaderId === user.id;
}
