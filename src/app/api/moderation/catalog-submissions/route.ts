import { auth } from "@clerk/nextjs/server";

import {
  listModerationCatalogSubmissions,
  serializeCatalogSubmission,
} from "@/lib/catalog-submissions";
import { logError } from "@/lib/logger";
import { requireModerator } from "@/lib/require-moderator";
import { CatalogSubmissionStatus } from "../../../../../generated/prisma/enums";

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
    return CatalogSubmissionStatus.PENDING;
  }

  if (
    value === CatalogSubmissionStatus.PENDING ||
    value === CatalogSubmissionStatus.REJECTED ||
    value === CatalogSubmissionStatus.APPROVED
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
    const result = await listModerationCatalogSubmissions({
      status,
      page,
      limit,
    });

    return Response.json({
      submissions: result.submissions.map(serializeCatalogSubmission),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (err) {
    logError("Moderation catalog submission list failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
