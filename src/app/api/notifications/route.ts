import { auth } from "@clerk/nextjs/server";

import {
  deleteAllNotifications,
  deleteSelectedNotifications,
  listNotifications,
  serializeNotification,
} from "@/lib/notifications";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function parseLimit(value: string | null): number {
  if (!value) {
    return DEFAULT_LIMIT;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
}

function parseOffset(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

export async function GET(req: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const limit = parseLimit(searchParams.get("limit"));
  const offset = parseOffset(searchParams.get("offset"));

  try {
    const result = await listNotifications({
      userId,
      unreadOnly,
      limit,
      offset,
    });

    return Response.json({
      notifications: result.notifications.map(serializeNotification),
      unreadCount: result.unreadCount,
      totalCount: result.totalCount,
    });
  } catch (err) {
    console.error("Notification list failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let ids: string[] | undefined;

    try {
      const text = await req.text();
      if (text) {
        const body = JSON.parse(text) as { ids?: string[] };
        ids = body.ids;
      }
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const deletedCount = ids
      ? await deleteSelectedNotifications(userId, ids)
      : await deleteAllNotifications(userId);

    return Response.json({ deletedCount });
  } catch (err) {
    console.error("Delete notifications failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
