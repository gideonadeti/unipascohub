import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  getPascoViewCount,
  getRequestViewerKey,
  recordPascoView,
} from "@/lib/pasco-engagement";
import {
  checkRateLimit,
  getPascoViewDedupeOptions,
  getPascoViewGlobalRateLimitOptions,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pascoId: string }> },
) {
  const { isAuthenticated, userId } = await auth();
  const viewerKey = getRequestViewerKey(req, isAuthenticated ? userId : null);

  const globalRateLimitResult = await checkRateLimit(
    `pasco-view-global:${viewerKey}`,
    getPascoViewGlobalRateLimitOptions(),
  );

  if (globalRateLimitResult.rateLimited) {
    const headers =
      globalRateLimitResult.retryAfterSeconds !== undefined
        ? { "Retry-After": String(globalRateLimitResult.retryAfterSeconds) }
        : undefined;

    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers },
    );
  }

  const { pascoId } = await params;

  const dedupeRateLimitResult = await checkRateLimit(
    `pasco-view:${pascoId}:${viewerKey}`,
    getPascoViewDedupeOptions(),
  );

  try {
    if (dedupeRateLimitResult.rateLimited) {
      const result = await getPascoViewCount(pascoId);

      if (!result.success) {
        return Response.json({ error: "Pasco not found" }, { status: 404 });
      }

      return Response.json({
        viewCount: result.viewCount,
        recorded: false,
      });
    }

    const result = await recordPascoView(pascoId);

    if (!result.success) {
      return Response.json({ error: "Pasco not found" }, { status: 404 });
    }

    return Response.json({
      viewCount: result.viewCount,
      recorded: true,
    });
  } catch (err) {
    console.error("Pasco view record failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
