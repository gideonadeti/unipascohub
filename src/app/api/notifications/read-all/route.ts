import { auth } from "@clerk/nextjs/server";
import { logError } from "@/lib/logger";
import { markAllNotificationsRead } from "@/lib/notifications";

export const runtime = "nodejs";

export async function PATCH() {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updatedCount = await markAllNotificationsRead(userId);

    return Response.json({ updatedCount });
  } catch (err) {
    logError("Mark all notifications read failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
