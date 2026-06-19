import { prisma } from "@/lib/db";
import { isModeratorRole } from "@/lib/pasco-permissions";
import type { UserRole } from "@/types/api/users";
import type { Prisma } from "../../generated/prisma/client";
import {
  PascoModerationStatus,
  type PascoModerationStatus as PascoModerationStatusValue,
} from "../../generated/prisma/enums";

type TransactionClient = Prisma.TransactionClient;

const DEFAULT_DISLIKE_THRESHOLD = 5;

export type PascoViewerContext = {
  userId?: string | null;
  role?: UserRole | null;
};

export type PascoVisibilityFields = {
  uploaderId: string | null;
  moderationStatus: PascoModerationStatusValue;
};

export function getModerationDislikeThreshold(): number {
  const raw = process.env.MODERATION_DISLIKE_THRESHOLD?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_DISLIKE_THRESHOLD;

  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_DISLIKE_THRESHOLD;
  }

  return parsed;
}

export function canViewPasco(
  viewer: PascoViewerContext | null | undefined,
  pasco: PascoVisibilityFields,
): boolean {
  if (pasco.moderationStatus === PascoModerationStatus.PUBLISHED) {
    return true;
  }

  if (!viewer?.userId) {
    return false;
  }

  if (isModeratorRole(viewer.role ?? null)) {
    return true;
  }

  if (
    pasco.moderationStatus === PascoModerationStatus.PENDING_REVIEW &&
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
  if (pasco.moderationStatus === PascoModerationStatus.PUBLISHED) {
    return false;
  }

  if (!viewer?.userId) {
    return false;
  }

  return (
    isModeratorRole(viewer.role ?? null) || pasco.uploaderId === viewer.userId
  );
}

export async function maybeFlagPascoForReview(
  tx: TransactionClient,
  pascoId: string,
  previousDislikeCount: number,
  newDislikeCount: number,
  currentStatus: PascoModerationStatusValue,
): Promise<void> {
  const threshold = getModerationDislikeThreshold();

  if (currentStatus !== PascoModerationStatus.PUBLISHED) {
    return;
  }

  if (previousDislikeCount >= threshold || newDislikeCount < threshold) {
    return;
  }

  await tx.pasco.update({
    where: { id: pascoId },
    data: { moderationStatus: PascoModerationStatus.PENDING_REVIEW },
  });
}

export type ModeratePascoAction = "approve" | "reject";

export type ModeratePascoError = "not_found" | "invalid_transition";

export async function moderatePasco(
  pascoId: string,
  action: ModeratePascoAction,
): Promise<
  | { success: true; moderationStatus: PascoModerationStatusValue }
  | { success: false; error: ModeratePascoError }
> {
  const pasco = await prisma.pasco.findUnique({
    where: { id: pascoId },
    select: { id: true, moderationStatus: true },
  });

  if (!pasco) {
    return { success: false, error: "not_found" };
  }

  if (pasco.moderationStatus !== PascoModerationStatus.PENDING_REVIEW) {
    return { success: false, error: "invalid_transition" };
  }

  const nextStatus =
    action === "approve"
      ? PascoModerationStatus.PUBLISHED
      : PascoModerationStatus.REJECTED;

  const updated = await prisma.pasco.update({
    where: { id: pascoId },
    data: { moderationStatus: nextStatus },
    select: { moderationStatus: true },
  });

  return { success: true, moderationStatus: updated.moderationStatus };
}

export type ModerationPascoListQuery = {
  status?: PascoModerationStatusValue;
  page: number;
  limit: number;
};

export async function listModerationPascos(params: ModerationPascoListQuery) {
  const status = params.status ?? PascoModerationStatus.PENDING_REVIEW;
  const where = { moderationStatus: status };
  const skip = (params.page - 1) * params.limit;

  const [total, pascos] = await Promise.all([
    prisma.pasco.count({ where }),
    prisma.pasco.findMany({
      where,
      include: {
        course: { select: { code: true, title: true } },
        uploader: { select: { id: true, name: true } },
        files: { orderBy: { order: "asc" } },
      },
      orderBy: [{ dislikeCount: "desc" }, { createdAt: "desc" }],
      skip,
      take: params.limit,
    }),
  ]);

  return {
    pascos,
    total,
    page: params.page,
    limit: params.limit,
  };
}
