import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getPascoFileSignedUrl } from "@/lib/pasco-engagement";
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
    `pasco-file-view:${userId}`,
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

  try {
    const result = await getPascoFileSignedUrl(pascoId, fileId);

    if (!result.success) {
      switch (result.error) {
        case "pasco_not_found":
          return Response.json({ error: "Pasco not found" }, { status: 404 });
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
            { error: "Could not prepare view" },
            { status: 502 },
          );
      }
    }

    return Response.json({
      fileUrl: result.fileUrl,
      fileName: result.fileName,
    });
  } catch (err) {
    console.error("Pasco file view URL failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
