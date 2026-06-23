import { Readable } from "node:stream";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";
import {
  buildPascoZipFilename,
  createPascoDownloadAllZipStream,
  recordPascoDownloadAll,
} from "@/lib/pasco-download-all";
import { getPascoViewerContext } from "@/lib/pascos";
import {
  checkRateLimit,
  getPascoDownloadRateLimitOptions,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ pascoId: string }> },
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

  const { pascoId } = await params;
  const viewer = await getPascoViewerContext(userId);

  try {
    const recordResult = await recordPascoDownloadAll(userId, pascoId, viewer);

    if (!recordResult.success) {
      switch (recordResult.error) {
        case "pasco_not_found":
          return Response.json({ error: "Pasco not found" }, { status: 404 });
        case "user_not_found":
          return Response.json({ error: "User not found" }, { status: 404 });
        case "insufficient_files":
          return Response.json(
            { error: "At least two files are required for bulk download" },
            { status: 400 },
          );
      }
    }

    const pascoCourse = await prisma.pasco.findUnique({
      where: { id: pascoId },
      select: {
        course: {
          select: { code: true },
        },
      },
    });

    const zipStreamResult = await createPascoDownloadAllZipStream(
      recordResult.files,
    );

    if (!zipStreamResult.success) {
      switch (zipStreamResult.error) {
        case "asset_not_found":
          return Response.json({ error: "File not found" }, { status: 404 });
        case "missing_config":
          return Response.json(
            { error: "Cloudinary is not configured" },
            { status: 500 },
          );
        case "signed_url_failed":
        case "download_failed":
          return Response.json(
            { error: "Could not prepare download" },
            { status: 502 },
          );
      }
    }

    const zipName = buildPascoZipFilename(
      recordResult.pasco,
      pascoCourse?.course,
    );

    return new Response(Readable.toWeb(zipStreamResult.stream) as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
        "X-Pasco-Download-Count": String(recordResult.downloadCount),
      },
    });
  } catch (err) {
    logError("Pasco download-all failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
