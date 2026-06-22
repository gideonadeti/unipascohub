import { auth } from "@clerk/nextjs/server";

import { createFeedback, listFeedback } from "@/lib/feedback";
import { createFeedbackSubmittedNotification } from "@/lib/notifications";
import { requireModerator } from "@/lib/require-moderator";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authResult = await requireModerator(userId);

  if (!authResult.success) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rawStatus = searchParams.get("status");
  const rawCategory = searchParams.get("category");
  const rawPage = searchParams.get("page");
  const rawLimit = searchParams.get("limit");
  const status = rawStatus ?? undefined;
  const category = rawCategory ?? undefined;
  const page = rawPage ? Number.parseInt(rawPage, 10) : 1;
  const limit = rawLimit ? Number.parseInt(rawLimit, 10) : 20;

  try {
    const result = await listFeedback({ status, category, page, limit });

    return Response.json(result);
  } catch (err) {
    console.error("List feedback failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { isAuthenticated, userId } = await auth();

  try {
    const result = await createFeedback({
      ...body,
      userId: isAuthenticated ? userId : undefined,
    } as Parameters<typeof createFeedback>[0]);

    // Notify moderators about the new feedback
    await createFeedbackSubmittedNotification(
      body.category as string,
      body.subject as string,
    );

    return Response.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof Error && "issues" in err) {
      const zodError = err as { issues: Array<{ message: string }> };

      return Response.json(
        { error: zodError.issues[0]?.message ?? "Validation error" },
        { status: 422 },
      );
    }

    console.error("Create feedback failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
