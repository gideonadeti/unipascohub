import { auth } from "@clerk/nextjs/server";

import { cleanupOrphanCloudinaryAssets } from "@/lib/cloudinary-orphans";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
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

  let body: unknown = {};

  try {
    const text = await req.text();

    if (text.length > 0) {
      body = JSON.parse(text);
    }
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let dryRun = true;
  let courseId: string | undefined;

  if (body !== null && typeof body === "object" && !Array.isArray(body)) {
    const record = body as Record<string, unknown>;

    if ("dryRun" in record) {
      if (typeof record.dryRun !== "boolean") {
        return Response.json({ error: "Invalid dryRun" }, { status: 400 });
      }

      dryRun = record.dryRun;
    }

    if ("courseId" in record) {
      if (
        typeof record.courseId !== "string" ||
        record.courseId.trim() === ""
      ) {
        return Response.json({ error: "Invalid courseId" }, { status: 400 });
      }

      courseId = record.courseId.trim();
    }
  }

  try {
    const result = await cleanupOrphanCloudinaryAssets({
      dryRun,
      courseId,
      triggeredById: userId,
    });

    return Response.json({
      dryRun,
      courseId: courseId ?? null,
      scanned: result.scanned,
      orphanCount: result.orphans.length,
      orphans: result.orphans,
      deleted: result.deleted,
      deleteFailures: result.deleteFailures,
    });
  } catch (err) {
    console.error("Cloudinary orphan cleanup failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
