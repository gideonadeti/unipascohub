import { auth } from "@clerk/nextjs/server";

import { requireAdmin } from "@/lib/require-admin";
import { listStorageCleanupRuns } from "@/lib/storage-cleanup-log";
import { serializeStorageCleanupRun } from "@/types/api/storage-cleanup";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseLimitParam(value: string | null): number {
  if (value === null) {
    return DEFAULT_LIMIT;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
}

export async function GET(req: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminResult = await requireAdmin(userId);

  if (!adminResult.success) {
    switch (adminResult.error) {
      case "not_found":
        return Response.json({ error: "User not found" }, { status: 404 });
      case "forbidden":
        return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { searchParams } = new URL(req.url);
  const limit = parseLimitParam(searchParams.get("limit"));

  try {
    const runs = await listStorageCleanupRuns(limit);

    return Response.json({
      runs: runs.map(serializeStorageCleanupRun),
    });
  } catch (err) {
    console.error("Failed to list storage cleanup runs:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
