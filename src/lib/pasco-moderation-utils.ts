import { isModeratorRole } from "@/lib/pasco-permissions";
import type {
  PascoModerationSource,
  PascoModerationStatus,
} from "@/types/api/pascos";
import type { UserRole } from "@/types/api/users";

export type PascoViewerContext = {
  userId?: string | null;
  role?: UserRole | null;
};

export type PascoVisibilityFields = {
  uploaderId: string | null;
  moderationStatus: PascoModerationStatus;
};

export function canViewPasco(
  viewer: PascoViewerContext | null | undefined,
  pasco: PascoVisibilityFields,
): boolean {
  if (pasco.moderationStatus === "PUBLISHED") {
    return true;
  }

  if (!viewer?.userId) {
    return false;
  }

  if (isModeratorRole(viewer.role ?? null)) {
    return true;
  }

  if (
    (pasco.moderationStatus === "PENDING_REVIEW" ||
      pasco.moderationStatus === "REJECTED") &&
    pasco.uploaderId === viewer.userId
  ) {
    return true;
  }

  return false;
}

export function shouldIncludeModerationStatus(
  viewer: PascoViewerContext | null | undefined,
  pasco: PascoVisibilityFields,
): boolean {
  if (pasco.moderationStatus === "PUBLISHED") {
    return false;
  }

  if (!viewer?.userId) {
    return false;
  }

  return (
    isModeratorRole(viewer.role ?? null) || pasco.uploaderId === viewer.userId
  );
}

export function shouldIncludeModerationSource(
  viewer: PascoViewerContext | null | undefined,
): boolean {
  return isModeratorRole(viewer?.role ?? null);
}

export function shouldExposeUploaderId(
  viewer: PascoViewerContext | null | undefined,
  pasco: Pick<PascoVisibilityFields, "uploaderId">,
): boolean {
  if (!viewer?.userId || !pasco.uploaderId) {
    return false;
  }

  if (isModeratorRole(viewer.role ?? null)) {
    return true;
  }

  return pasco.uploaderId === viewer.userId;
}

export type PascoModerationDetailFields = PascoVisibilityFields & {
  moderationSource?: PascoModerationSource | null;
  rejectionReason?: string | null;
  moderationNote?: string | null;
};
