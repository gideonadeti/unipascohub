import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";
import { requireAdmin } from "@/lib/require-admin";
import { PascoModerationStatus } from "../../../../../generated/prisma/enums";

export const runtime = "nodejs";

export async function GET() {
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

  try {
    const [
      totalUsers,
      totalPascos,
      publishedPascos,
      pendingModeration,
      totalCleanupRuns,
      unresolvedFailures,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.pasco.count(),
      prisma.pasco.count({
        where: { moderationStatus: PascoModerationStatus.PUBLISHED },
      }),
      prisma.pasco.count({
        where: { moderationStatus: PascoModerationStatus.PENDING_REVIEW },
      }),
      prisma.storageCleanupRun.count(),
      prisma.storageCleanupFailure.count({ where: { resolvedAt: null } }),
    ]);

    return Response.json({
      totalUsers,
      totalPascos,
      publishedPascos,
      pendingModeration,
      totalCleanupRuns,
      unresolvedFailures,
    });
  } catch (err) {
    logError("Admin stats fetch failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
