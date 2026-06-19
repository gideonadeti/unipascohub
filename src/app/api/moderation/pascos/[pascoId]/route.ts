import { auth } from "@clerk/nextjs/server";

import { moderatePasco } from "@/lib/pasco-moderation";
import { requireModerator } from "@/lib/require-moderator";

export const runtime = "nodejs";

type ModerationAction = "approve" | "reject";

function parseAction(body: unknown): ModerationAction | null {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const action = (body as Record<string, unknown>).action;

  if (action === "approve" || action === "reject") {
    return action;
  }

  return null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ pascoId: string }> },
) {
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

  const { pascoId } = await params;

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = parseAction(body);

  if (!action) {
    return Response.json(
      { error: "Invalid action (allowed: approve, reject)" },
      { status: 400 },
    );
  }

  try {
    const result = await moderatePasco(pascoId, action);

    if (!result.success) {
      switch (result.error) {
        case "not_found":
          return Response.json({ error: "Pasco not found" }, { status: 404 });
        case "invalid_transition":
          return Response.json(
            { error: "Pasco is not pending review" },
            { status: 409 },
          );
      }
    }

    return Response.json({ moderationStatus: result.moderationStatus });
  } catch (err) {
    console.error("Moderation pasco update failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
