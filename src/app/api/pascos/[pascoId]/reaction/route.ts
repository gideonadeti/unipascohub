import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import {
  parsePascoReactionBody,
  setPascoReaction,
} from "@/lib/pasco-engagement";
import {
  checkRateLimit,
  getPascoReactionRateLimitOptions,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ pascoId: string }> },
) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitResult = await checkRateLimit(
    `pasco-reaction:${userId}`,
    getPascoReactionRateLimitOptions(),
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

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parsePascoReactionBody(body);

  if (!parsed.success) {
    switch (parsed.error) {
      case "invalid_body":
        return Response.json(
          {
            error: "Request must include reactionType (LIKE, DISLIKE, or null)",
          },
          { status: 400 },
        );
      case "invalid_reaction_type":
        return Response.json(
          { error: "Invalid reactionType" },
          { status: 400 },
        );
    }
  }

  try {
    const result = await setPascoReaction(userId, pascoId, parsed.data);

    if (!result.success) {
      switch (result.error) {
        case "pasco_not_found":
          return Response.json({ error: "Pasco not found" }, { status: 404 });
        case "user_not_found":
          return Response.json({ error: "User not found" }, { status: 404 });
      }
    }

    return Response.json({
      likeCount: result.likeCount,
      dislikeCount: result.dislikeCount,
      viewerReaction: result.viewerReaction,
    });
  } catch (err) {
    logError("Pasco reaction update failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
