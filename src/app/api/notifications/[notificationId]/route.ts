import { auth } from "@clerk/nextjs/server";

import { deleteNotification } from "@/lib/notifications";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { notificationId } = await params;

  try {
    const deleted = await deleteNotification(notificationId, userId);

    if (!deleted) {
      return Response.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Delete notification failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
