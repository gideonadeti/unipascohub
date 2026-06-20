import { auth } from "@clerk/nextjs/server";

import {
  getModerationSettingsForApi,
  setModerationDislikeThreshold,
} from "@/lib/moderation-settings";
import { requireAdmin } from "@/lib/require-admin";
import { requireModerator } from "@/lib/require-moderator";

export const runtime = "nodejs";

function parseThreshold(body: unknown): number | null {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const value = (body as Record<string, unknown>).dislikeThreshold;

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

export async function GET() {
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

  try {
    const settings = await getModerationSettingsForApi();

    return Response.json(settings);
  } catch (err) {
    console.error("Moderation settings read failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
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

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const threshold = parseThreshold(body);

  if (threshold === null || threshold < 1) {
    return Response.json(
      { error: "Invalid dislikeThreshold (must be a number >= 1)" },
      { status: 400 },
    );
  }

  try {
    const dislikeThreshold = await setModerationDislikeThreshold(threshold);

    return Response.json({ dislikeThreshold });
  } catch (err) {
    console.error("Moderation settings update failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
