import { auth } from "@clerk/nextjs/server";
import { logError } from "@/lib/logger";
import { requireAdmin } from "@/lib/require-admin";
import { listStorageCleanupFailures } from "@/lib/storage-cleanup-log";
import { serializeStorageCleanupFailure } from "@/types/api/storage-cleanup";

export const runtime = "nodejs";

function parseResolvedParam(value: string | null): boolean {
  if (value === null || value === "false") {
    return false;
  }

  if (value === "true") {
    return true;
  }

  return false;
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
      default:
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const resolved = parseResolvedParam(searchParams.get("resolved"));

  try {
    const failures = await listStorageCleanupFailures({ resolved });

    return Response.json({
      failures: failures.map(serializeStorageCleanupFailure),
    });
  } catch (err) {
    logError("Failed to list storage cleanup failures", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
