import { auth } from "@clerk/nextjs/server";

import { listNotifications, serializeNotification } from "@/lib/notifications";

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

export async function GET(req: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const limit = parseLimit(searchParams.get("limit"));

  try {
    const result = await listNotifications({
      userId,
      unreadOnly,
      limit,
    });

    return Response.json({
      notifications: result.notifications.map(serializeNotification),
      unreadCount: result.unreadCount,
    });
  } catch (err) {
    console.error("Notification list failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
