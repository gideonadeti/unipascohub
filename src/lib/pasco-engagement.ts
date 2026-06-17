import { createSignedCloudinaryDownloadUrl } from "@/lib/cloudinary";
import { prisma } from "@/lib/db";
import {
  PascoReactionType,
  type PascoReactionType as PascoReactionTypeValue,
} from "../../generated/prisma/enums";

export type PascoReactionInput = PascoReactionTypeValue | null;

type PascoReactionParseError = "invalid_body" | "invalid_reaction_type";

type SetPascoReactionError = "pasco_not_found" | "user_not_found";

type RecordPascoDownloadError = GetPascoFileSignedUrlError | "user_not_found";

export type GetPascoFileSignedUrlError =
  | "pasco_not_found"
  | "file_not_found"
  | "asset_not_found"
  | "missing_config"
  | "signed_url_failed";

type RecordPascoViewError = "pasco_not_found";

function parseRequestIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstHop = forwardedFor.split(",")[0]?.trim();

    if (firstHop) {
      return firstHop;
    }
  }

  const realIp = req.headers.get("x-real-ip")?.trim();

  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export function getRequestViewerKey(
  req: Request,
  userId?: string | null,
): string {
  if (userId) {
    return `user:${userId}`;
  }

  return `ip:${parseRequestIp(req)}`;
}

export async function getPascoViewCount(
  pascoId: string,
): Promise<
  | { success: true; viewCount: number }
  | { success: false; error: RecordPascoViewError }
> {
  const pasco = await prisma.pasco.findUnique({
    where: { id: pascoId },
    select: { viewCount: true },
  });

  if (!pasco) {
    return { success: false, error: "pasco_not_found" };
  }

  return { success: true, viewCount: pasco.viewCount };
}

export async function recordPascoView(
  pascoId: string,
): Promise<
  | { success: true; viewCount: number }
  | { success: false; error: RecordPascoViewError }
> {
  const pasco = await prisma.pasco.findUnique({
    where: { id: pascoId },
    select: { id: true },
  });

  if (!pasco) {
    return { success: false, error: "pasco_not_found" };
  }

  const updated = await prisma.pasco.update({
    where: { id: pascoId },
    data: {
      viewCount: { increment: 1 },
    },
    select: {
      viewCount: true,
    },
  });

  return { success: true, viewCount: updated.viewCount };
}

export function parsePascoReactionBody(
  body: unknown,
):
  | { success: true; data: PascoReactionInput }
  | { success: false; error: PascoReactionParseError } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "invalid_body" };
  }

  const record = body as Record<string, unknown>;

  if (!("reactionType" in record)) {
    return { success: false, error: "invalid_body" };
  }

  if (record.reactionType === null) {
    return { success: true, data: null };
  }

  if (
    record.reactionType === PascoReactionType.LIKE ||
    record.reactionType === PascoReactionType.DISLIKE
  ) {
    return { success: true, data: record.reactionType };
  }

  return { success: false, error: "invalid_reaction_type" };
}

function counterDeltaForReaction(reactionType: PascoReactionTypeValue): {
  likeCount: number;
  dislikeCount: number;
} {
  if (reactionType === PascoReactionType.LIKE) {
    return { likeCount: 1, dislikeCount: 0 };
  }

  return { likeCount: 0, dislikeCount: 1 };
}

export async function getViewerReactionsForPascos(
  userId: string,
  pascoIds: string[],
): Promise<Map<string, PascoReactionTypeValue>> {
  if (pascoIds.length === 0) {
    return new Map();
  }

  const reactions = await prisma.pascoReaction.findMany({
    where: {
      userId,
      pascoId: { in: pascoIds },
    },
    select: {
      pascoId: true,
      reactionType: true,
    },
  });

  return new Map(
    reactions.map((reaction) => [reaction.pascoId, reaction.reactionType]),
  );
}

export async function setPascoReaction(
  userId: string,
  pascoId: string,
  reactionType: PascoReactionInput,
): Promise<
  | {
      success: true;
      likeCount: number;
      dislikeCount: number;
      viewerReaction: PascoReactionInput;
    }
  | { success: false; error: SetPascoReactionError }
> {
  const [pasco, user] = await Promise.all([
    prisma.pasco.findUnique({
      where: { id: pascoId },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    }),
  ]);

  if (!pasco) {
    return { success: false, error: "pasco_not_found" };
  }

  if (!user) {
    return { success: false, error: "user_not_found" };
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.pascoReaction.findUnique({
      where: {
        userId_pascoId: {
          userId,
          pascoId,
        },
      },
    });

    let likeDelta = 0;
    let dislikeDelta = 0;
    let viewerReaction: PascoReactionInput = reactionType;

    if (reactionType === null) {
      if (existing) {
        const removeDelta = counterDeltaForReaction(existing.reactionType);
        likeDelta -= removeDelta.likeCount;
        dislikeDelta -= removeDelta.dislikeCount;

        await tx.pascoReaction.delete({
          where: { id: existing.id },
        });
      }

      viewerReaction = null;
    } else if (!existing) {
      const addDelta = counterDeltaForReaction(reactionType);
      likeDelta += addDelta.likeCount;
      dislikeDelta += addDelta.dislikeCount;

      await tx.pascoReaction.create({
        data: {
          userId,
          pascoId,
          reactionType,
        },
      });
    } else if (existing.reactionType === reactionType) {
      viewerReaction = existing.reactionType;
    } else {
      const removeDelta = counterDeltaForReaction(existing.reactionType);
      const addDelta = counterDeltaForReaction(reactionType);
      likeDelta += addDelta.likeCount - removeDelta.likeCount;
      dislikeDelta += addDelta.dislikeCount - removeDelta.dislikeCount;

      await tx.pascoReaction.update({
        where: { id: existing.id },
        data: { reactionType },
      });
    }

    if (likeDelta === 0 && dislikeDelta === 0) {
      const current = await tx.pasco.findUniqueOrThrow({
        where: { id: pascoId },
        select: {
          likeCount: true,
          dislikeCount: true,
        },
      });

      return {
        success: true,
        likeCount: current.likeCount,
        dislikeCount: current.dislikeCount,
        viewerReaction,
      };
    }

    const updated = await tx.pasco.update({
      where: { id: pascoId },
      data: {
        likeCount: { increment: likeDelta },
        dislikeCount: { increment: dislikeDelta },
      },
      select: {
        likeCount: true,
        dislikeCount: true,
      },
    });

    return {
      success: true,
      likeCount: updated.likeCount,
      dislikeCount: updated.dislikeCount,
      viewerReaction,
    };
  });
}

export async function getPascoFileSignedUrl(
  pascoId: string,
  fileId: string,
): Promise<
  | { success: true; fileUrl: string; fileName: string }
  | { success: false; error: GetPascoFileSignedUrlError }
> {
  const [pasco, file] = await Promise.all([
    prisma.pasco.findUnique({
      where: { id: pascoId },
      select: { id: true },
    }),
    prisma.pascoFile.findFirst({
      where: {
        id: fileId,
        pascoId,
      },
      select: {
        publicId: true,
        fileName: true,
        resourceType: true,
      },
    }),
  ]);

  if (!pasco) {
    return { success: false, error: "pasco_not_found" };
  }

  if (!file) {
    return { success: false, error: "file_not_found" };
  }

  const signedUrlResult = await createSignedCloudinaryDownloadUrl({
    publicId: file.publicId,
    fileName: file.fileName,
    resourceType: file.resourceType,
  });

  if (!signedUrlResult.success) {
    return { success: false, error: signedUrlResult.error };
  }

  return {
    success: true,
    fileUrl: signedUrlResult.url,
    fileName: file.fileName,
  };
}

export async function recordPascoDownload(
  userId: string,
  pascoId: string,
  fileId: string,
): Promise<
  | {
      success: true;
      downloadCount: number;
      fileUrl: string;
      fileName: string;
    }
  | { success: false; error: RecordPascoDownloadError }
> {
  const [pasco, user, file] = await Promise.all([
    prisma.pasco.findUnique({
      where: { id: pascoId },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    }),
    prisma.pascoFile.findFirst({
      where: {
        id: fileId,
        pascoId,
      },
      select: {
        id: true,
        publicId: true,
        fileName: true,
        resourceType: true,
      },
    }),
  ]);

  if (!pasco) {
    return { success: false, error: "pasco_not_found" };
  }

  if (!user) {
    return { success: false, error: "user_not_found" };
  }

  if (!file) {
    return { success: false, error: "file_not_found" };
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.pascoDownload.create({
      data: {
        userId,
        pascoId,
        fileId,
      },
    });

    return tx.pasco.update({
      where: { id: pascoId },
      data: {
        downloadCount: { increment: 1 },
      },
      select: {
        downloadCount: true,
      },
    });
  });

  const signedUrlResult = await getPascoFileSignedUrl(pascoId, fileId);

  if (!signedUrlResult.success) {
    return { success: false, error: signedUrlResult.error };
  }

  return {
    success: true,
    downloadCount: updated.downloadCount,
    fileUrl: signedUrlResult.fileUrl,
    fileName: signedUrlResult.fileName,
  };
}
