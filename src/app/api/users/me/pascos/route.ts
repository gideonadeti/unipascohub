import { auth } from "@clerk/nextjs/server";

import { listMyPascos, serializePasco } from "@/lib/pascos";
import { requireContributor } from "@/lib/require-contributor";
import { PascoModerationStatus } from "../../../../../../generated/prisma/enums";

export const runtime = "nodejs";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

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

function parseModerationStatus(value: string | null) {
  if (!value) {
    return undefined;
  }

  if (
    value === PascoModerationStatus.PUBLISHED ||
    value === PascoModerationStatus.PENDING_REVIEW ||
    value === PascoModerationStatus.REJECTED
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

  const contributorResult = await requireContributor(userId);

  if (!contributorResult.success) {
    switch (contributorResult.error) {
      case "not_found":
        return Response.json({ error: "User not found" }, { status: 404 });
      case "forbidden":
        return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { searchParams } = new URL(req.url);
  const moderationStatusParam = searchParams.get("moderationStatus");
  let moderationStatus:
    | (typeof PascoModerationStatus)[keyof typeof PascoModerationStatus]
    | undefined;

  if (moderationStatusParam) {
    const parsed = parseModerationStatus(moderationStatusParam);

    if (parsed === null) {
      return Response.json(
        { error: "Invalid moderationStatus" },
        { status: 400 },
      );
    }

    moderationStatus = parsed;
  }

  const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
  const limit = Math.min(
    parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT),
    MAX_LIMIT,
  );

  try {
    const result = await listMyPascos({
      uploaderId: userId,
      moderationStatus,
      page,
      limit,
    });
    const viewer = { userId, role: contributorResult.user.role };

    return Response.json({
      pascos: result.pascos.map((pasco) => ({
        ...serializePasco(pasco, { viewer }),
        moderationStatus: pasco.moderationStatus,
        ...(pasco.rejectionReason
          ? { rejectionReason: pasco.rejectionReason }
          : {}),
      })),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (err) {
    console.error("My pasco list failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
