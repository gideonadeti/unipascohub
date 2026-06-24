import { auth } from "@clerk/nextjs/server";

import { updateFeedbackStatus } from "@/lib/feedback";
import { logError } from "@/lib/logger";
import { requireModerator } from "@/lib/require-moderator";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authResult = await requireModerator(userId);

  if (!authResult.success) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: { status?: string };

  try {
    body = (await req.json()) as { status?: string };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.status || !["NEW", "READ", "ARCHIVED"].includes(body.status)) {
    return Response.json(
      { error: "Invalid status. Must be NEW, READ, or ARCHIVED" },
      { status: 422 },
    );
  }

  try {
    const result = await updateFeedbackStatus(id, body.status);

    return Response.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "Invalid status") {
      return Response.json({ error: err.message }, { status: 422 });
    }

    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code: string }).code === "P2025"
    ) {
      return Response.json({ error: "Feedback not found" }, { status: 404 });
    }

    logError("Update feedback status failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
