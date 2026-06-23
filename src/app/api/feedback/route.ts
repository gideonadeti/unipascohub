import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";

import { getClientIp } from "@/lib/client-ip";
import { createFeedback, listFeedback } from "@/lib/feedback";
import { logError } from "@/lib/logger";
import { createFeedbackSubmittedNotification } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/rate-limit";
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
    logError("List feedback failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  Sentry.addBreadcrumb({
    category: "feedback",
    message: "Creating feedback",
    data: { origin, referer },
  });

  if (origin || referer) {
    const allowedOrigins = [
      "http://localhost:3000",
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
      process.env.NEXT_PUBLIC_APP_URL,
    ].filter(Boolean) as string[];

    const requestOrigin = (origin ?? referer ?? "").replace(/\/+$/, "");
    const isAllowed = allowedOrigins.some(
      (allowed) =>
        requestOrigin === allowed || requestOrigin.startsWith(`${allowed}/`),
    );

    if (!isAllowed) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const rateLimit = await checkRateLimit(`feedback:${getClientIp(req)}`, {
    limit: 10,
    windowMs: 60_000,
  });

  if (rateLimit.rateLimited) {
    return Response.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

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

    logError("Create feedback failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
