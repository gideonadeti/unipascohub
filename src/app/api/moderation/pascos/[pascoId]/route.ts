import { auth } from "@clerk/nextjs/server";
import { logError } from "@/lib/logger";
import {
  moderatePasco,
  runModerationSideEffects,
} from "@/lib/pasco-moderation";
import { requireModerator } from "@/lib/require-moderator";
import type { ModerationPascoAction } from "@/types/api/pascos";

export const runtime = "nodejs";

type ModerationRequestBody = {
  action?: unknown;
  reason?: unknown;
  note?: unknown;
};

function parseAction(
  body: ModerationRequestBody,
): ModerationPascoAction | null {
  const { action } = body;

  if (
    action === "approve" ||
    action === "reject" ||
    action === "restore" ||
    action === "flag"
  ) {
    return action;
  }

  return null;
}

function parseOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
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
      default:
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { pascoId } = await params;

  let body: ModerationRequestBody;

  try {
    body = (await req.json()) as ModerationRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = parseAction(body);

  if (!action) {
    return Response.json(
      {
        error: "Invalid action (allowed: approve, reject, restore, flag)",
      },
      { status: 400 },
    );
  }

  try {
    const result = await moderatePasco({
      pascoId,
      action,
      reason: parseOptionalString(body.reason),
      note: parseOptionalString(body.note),
    });

    if (!result.success) {
      switch (result.error) {
        case "not_found":
          return Response.json({ error: "Pasco not found" }, { status: 404 });
        case "reason_required":
          return Response.json(
            { error: "Rejection reason is required" },
            { status: 400 },
          );
        case "invalid_transition":
          return Response.json(
            { error: "Invalid moderation state transition" },
            { status: 409 },
          );
      }
    }

    await runModerationSideEffects(result.result);

    return Response.json({ moderationStatus: result.result.moderationStatus });
  } catch (err) {
    logError("Moderation pasco update failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
