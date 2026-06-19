import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { recordPascoDownload } from "@/lib/pasco-engagement";
import { getPascoViewerContext } from "@/lib/pascos";
import {
  checkRateLimit,
  getPascoDownloadRateLimitOptions,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ pascoId: string; fileId: string }> },
) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitResult = await checkRateLimit(
    `pasco-download:${userId}`,
    getPascoDownloadRateLimitOptions(),
  );

  if (rateLimitResult.rateLimited) {
    const headers =
      rateLimitResult.retryAfterSeconds !== undefined
        ? { "Retry-After": String(rateLimitResult.retryAfterSeconds) }
        : undefined;

    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers },
    );
  }

  const { pascoId, fileId } = await params;
  const viewer = await getPascoViewerContext(userId);

  try {
    const result = await recordPascoDownload(userId, pascoId, fileId, viewer);

    if (!result.success) {
      switch (result.error) {
        case "pasco_not_found":
          return Response.json({ error: "Pasco not found" }, { status: 404 });
        case "user_not_found":
          return Response.json({ error: "User not found" }, { status: 404 });
        case "file_not_found":
        case "asset_not_found":
          return Response.json({ error: "File not found" }, { status: 404 });
        case "missing_config":
          return Response.json(
            { error: "Cloudinary is not configured" },
            { status: 500 },
          );
        case "signed_url_failed":
          return Response.json(
            { error: "Could not prepare download" },
            { status: 502 },
          );
      }
    }

    return Response.json({
      downloadCount: result.downloadCount,
      fileUrl: result.fileUrl,
      fileName: result.fileName,
    });
  } catch (err) {
    console.error("Pasco download record failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
