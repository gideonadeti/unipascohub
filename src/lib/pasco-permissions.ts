import type { Pasco } from "@/types/api/pascos";
import type { ProfileUser } from "@/types/api/users";

const MODIFY_ROLES = new Set<ProfileUser["role"]>(["MODERATOR", "ADMIN"]);

const CONTRIBUTOR_ROLES = new Set<ProfileUser["role"]>([
  "CONTRIBUTOR",
  "MODERATOR",
  "ADMIN",
]);

export function isContributorRole(
  role: ProfileUser["role"] | null | undefined,
): boolean {
  if (!role) {
    return false;
  }

  return CONTRIBUTOR_ROLES.has(role);
}

export function isModeratorRole(
  role: ProfileUser["role"] | null | undefined,
): boolean {
  if (!role) {
    return false;
  }

  return MODIFY_ROLES.has(role);
}

export function isAdminRole(
  role: ProfileUser["role"] | null | undefined,
): boolean {
  return role === "ADMIN";
}

export function canUserDeletePasco(
  user: Pick<ProfileUser, "id" | "role"> | null | undefined,
  pasco: Pick<Pasco, "uploaderId">,
): boolean {
  if (!user) {
    return false;
  }

  return isAdminRole(user.role) || pasco.uploaderId === user.id;
}

export function canUserModifyPasco(
  user: Pick<ProfileUser, "id" | "role"> | null | undefined,
  pasco: Pick<Pasco, "uploaderId">,
): boolean {
  if (!user) {
    return false;
  }

  return MODIFY_ROLES.has(user.role) || pasco.uploaderId === user.id;
}
