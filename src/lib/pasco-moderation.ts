import { prisma } from "@/lib/db";
import { getModerationDislikeThreshold } from "@/lib/moderation-settings";
import {
  createModeratorQueueNotifications,
  createUploaderRejectedNotification,
} from "@/lib/notifications";
import type { Prisma } from "../../generated/prisma/client";
import {
  PascoModerationSource,
  PascoModerationStatus,
  type PascoModerationStatus as PascoModerationStatusValue,
} from "../../generated/prisma/enums";

export type {
  PascoModerationDetailFields,
  PascoViewerContext,
  PascoVisibilityFields,
} from "@/lib/pasco-moderation-utils";
export {
  canViewPasco,
  shouldIncludeModerationSource,
  shouldIncludeModerationStatus,
} from "@/lib/pasco-moderation-utils";

type TransactionClient = Prisma.TransactionClient;

export type PascoReactionModerationState = {
  id: string;
  moderationStatus: PascoModerationStatusValue;
  moderationSource:
    | (typeof PascoModerationSource)[keyof typeof PascoModerationSource]
    | null;
  dislikesAtLastApproval: number | null;
  dislikeCount: number;
};

export type ReactionModerationResult = {
  flagged: boolean;
  autoPublished: boolean;
};

export async function evaluateModerationOnReaction(
  tx: TransactionClient,
  pascoBefore: PascoReactionModerationState,
  newDislikeCount: number,
  dislikeDelta: number,
  threshold: number,
): Promise<ReactionModerationResult> {
  const result: ReactionModerationResult = {
    flagged: false,
    autoPublished: false,
  };

  if (
    pascoBefore.moderationStatus === PascoModerationStatus.PENDING_REVIEW &&
    pascoBefore.moderationSource === PascoModerationSource.DISLIKES &&
    newDislikeCount < threshold
  ) {
    await tx.pasco.update({
      where: { id: pascoBefore.id },
      data: { moderationStatus: PascoModerationStatus.PUBLISHED },
    });
    result.autoPublished = true;
    return result;
  }

  if (
    pascoBefore.moderationStatus !== PascoModerationStatus.PUBLISHED ||
    dislikeDelta <= 0 ||
    newDislikeCount < threshold ||
    newDislikeCount <= (pascoBefore.dislikesAtLastApproval ?? -1)
  ) {
    return result;
  }

  await tx.pasco.update({
    where: { id: pascoBefore.id },
    data: {
      moderationStatus: PascoModerationStatus.PENDING_REVIEW,
      moderationSource: PascoModerationSource.DISLIKES,
    },
  });
  result.flagged = true;

  return result;
}

export type ModeratePascoAction = "approve" | "reject" | "restore" | "flag";

export type ModeratePascoError =
  | "not_found"
  | "invalid_transition"
  | "reason_required";

export type ModeratePascoInput = {
  pascoId: string;
  action: ModeratePascoAction;
  reason?: string;
  note?: string;
};

export type ModeratePascoSuccess = {
  pascoId: string;
  moderationStatus: PascoModerationStatusValue;
  notifyModerators: boolean;
  notifyUploader: { uploaderId: string; reason: string } | null;
  pascoTitle: string;
};

async function getPascoNotificationTitle(pasco: {
  description: string | null;
  course: { code: string; title: string } | null;
}): Promise<string> {
  if (pasco.description?.trim()) {
    return pasco.description.trim();
  }

  if (pasco.course) {
    return `${pasco.course.code} — ${pasco.course.title}`;
  }

  return "Pasco";
}

export async function moderatePasco(
  input: ModeratePascoInput,
): Promise<
  | { success: true; result: ModeratePascoSuccess }
  | { success: false; error: ModeratePascoError }
> {
  const pasco = await prisma.pasco.findUnique({
    where: { id: input.pascoId },
    select: {
      id: true,
      uploaderId: true,
      description: true,
      dislikeCount: true,
      moderationStatus: true,
      course: { select: { code: true, title: true } },
    },
  });

  if (!pasco) {
    return { success: false, error: "not_found" };
  }

  const pascoTitle = await getPascoNotificationTitle(pasco);
  let notifyModerators = false;
  let notifyUploader: { uploaderId: string; reason: string } | null = null;

  switch (input.action) {
    case "approve": {
      if (pasco.moderationStatus !== PascoModerationStatus.PENDING_REVIEW) {
        return { success: false, error: "invalid_transition" };
      }

      const updated = await prisma.pasco.update({
        where: { id: input.pascoId },
        data: {
          moderationStatus: PascoModerationStatus.PUBLISHED,
          dislikesAtLastApproval: pasco.dislikeCount,
          rejectionReason: null,
        },
        select: { moderationStatus: true },
      });

      return {
        success: true,
        result: {
          pascoId: input.pascoId,
          moderationStatus: updated.moderationStatus,
          notifyModerators: false,
          notifyUploader: null,
          pascoTitle,
        },
      };
    }

    case "reject": {
      if (pasco.moderationStatus !== PascoModerationStatus.PENDING_REVIEW) {
        return { success: false, error: "invalid_transition" };
      }

      const reason = input.reason?.trim();

      if (!reason) {
        return { success: false, error: "reason_required" };
      }

      const updated = await prisma.pasco.update({
        where: { id: input.pascoId },
        data: {
          moderationStatus: PascoModerationStatus.REJECTED,
          rejectionReason: reason,
        },
        select: { moderationStatus: true },
      });

      if (pasco.uploaderId) {
        notifyUploader = { uploaderId: pasco.uploaderId, reason };
      }

      return {
        success: true,
        result: {
          pascoId: input.pascoId,
          moderationStatus: updated.moderationStatus,
          notifyModerators: false,
          notifyUploader,
          pascoTitle,
        },
      };
    }

    case "restore": {
      if (pasco.moderationStatus !== PascoModerationStatus.REJECTED) {
        return { success: false, error: "invalid_transition" };
      }

      const updated = await prisma.pasco.update({
        where: { id: input.pascoId },
        data: {
          moderationStatus: PascoModerationStatus.PUBLISHED,
          rejectionReason: null,
          dislikesAtLastApproval: pasco.dislikeCount,
        },
        select: { moderationStatus: true },
      });

      return {
        success: true,
        result: {
          pascoId: input.pascoId,
          moderationStatus: updated.moderationStatus,
          notifyModerators: false,
          notifyUploader: null,
          pascoTitle,
        },
      };
    }

    case "flag": {
      if (
        pasco.moderationStatus !== PascoModerationStatus.PUBLISHED &&
        pasco.moderationStatus !== PascoModerationStatus.REJECTED
      ) {
        return { success: false, error: "invalid_transition" };
      }

      const note = input.note?.trim();

      const updated = await prisma.pasco.update({
        where: { id: input.pascoId },
        data: {
          moderationStatus: PascoModerationStatus.PENDING_REVIEW,
          moderationSource: PascoModerationSource.MANUAL,
          moderationNote: note || null,
          rejectionReason: null,
        },
        select: { moderationStatus: true },
      });

      notifyModerators = true;

      return {
        success: true,
        result: {
          pascoId: input.pascoId,
          moderationStatus: updated.moderationStatus,
          notifyModerators,
          notifyUploader: null,
          pascoTitle,
        },
      };
    }
  }
}

export async function runModerationSideEffects(
  result: ModeratePascoSuccess,
): Promise<void> {
  if (result.notifyModerators) {
    await createModeratorQueueNotifications(result.pascoId, result.pascoTitle);
  }

  if (result.notifyUploader) {
    await createUploaderRejectedNotification(
      result.notifyUploader.uploaderId,
      result.pascoId,
      result.pascoTitle,
      result.notifyUploader.reason,
    );
  }
}

export async function notifyModeratorsPascoFlagged(
  pascoId: string,
): Promise<void> {
  const pasco = await prisma.pasco.findUnique({
    where: { id: pascoId },
    select: {
      description: true,
      course: { select: { code: true, title: true } },
    },
  });

  if (!pasco) {
    return;
  }

  const title = await getPascoNotificationTitle(pasco);
  await createModeratorQueueNotifications(pascoId, title);
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

export { getModerationDislikeThreshold };
