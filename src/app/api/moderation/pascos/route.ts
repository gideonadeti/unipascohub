import { auth } from "@clerk/nextjs/server";

import { listModerationPascos } from "@/lib/pasco-moderation";
import { serializePasco } from "@/lib/pascos";
import { requireModerator } from "@/lib/require-moderator";
import { PascoModerationStatus } from "../../../../../generated/prisma/enums";

export const runtime = "nodejs";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseStatus(value: string | null) {
  if (!value) {
    return PascoModerationStatus.PENDING_REVIEW;
  }

  if (
    value === PascoModerationStatus.PENDING_REVIEW ||
    value === PascoModerationStatus.REJECTED ||
    value === PascoModerationStatus.PUBLISHED
  ) {
    return value;
  }

  return null;
}

export async function GET(req: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const moderatorResult = await requireModerator(userId);

  if (!moderatorResult.success) {
    switch (moderatorResult.error) {
      case "not_found":
        return Response.json({ error: "User not found" }, { status: 404 });
      case "forbidden":
        return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { searchParams } = new URL(req.url);
  const status = parseStatus(searchParams.get("status"));

  if (!status) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
  const limit = Math.min(
    parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT),
    MAX_LIMIT,
  );

  try {
    const result = await listModerationPascos({ status, page, limit });
    const viewer = { userId, role: moderatorResult.user.role };

    return Response.json({
      pascos: result.pascos.map((pasco) => ({
        ...serializePasco(pasco, { viewer }),
        moderationStatus: pasco.moderationStatus,
        uploader: pasco.uploader
          ? { id: pasco.uploader.id, name: pasco.uploader.name }
          : null,
      })),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (err) {
    console.error("Moderation pasco list failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
