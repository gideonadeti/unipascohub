import { auth } from "@clerk/nextjs/server";

import {
  moderateCatalogSubmission,
  runCatalogSubmissionSideEffects,
} from "@/lib/catalog-submissions";
import { requireModerator } from "@/lib/require-moderator";
import type { ModerationCatalogSubmissionAction } from "@/types/api/catalog-submissions";

export const runtime = "nodejs";

type ModerationRequestBody = {
  action?: unknown;
  reason?: unknown;
};

function parseAction(
  body: ModerationRequestBody,
): ModerationCatalogSubmissionAction | null {
  const { action } = body;

  if (action === "approve" || action === "reject") {
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
  { params }: { params: Promise<{ submissionId: string }> },
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

  const { submissionId } = await params;

  let body: ModerationRequestBody;

  try {
    body = (await req.json()) as ModerationRequestBody;
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
    const result = await moderateCatalogSubmission({
      submissionId,
      reviewerId: userId,
      action,
      reason: parseOptionalString(body.reason),
    });

    if (!result.success) {
      switch (result.error) {
        case "not_found":
          return Response.json(
            { error: "Catalog submission not found" },
            { status: 404 },
          );
        case "reason_required":
          return Response.json(
            { error: "Rejection reason is required" },
            { status: 400 },
          );
        case "invalid_transition":
          return Response.json(
            { error: "Invalid catalog submission state transition" },
            { status: 409 },
          );
        case "institution_not_found":
          return Response.json(
            { error: "Institution not found" },
            { status: 404 },
          );
        case "program_not_found":
          return Response.json({ error: "Program not found" }, { status: 404 });
        case "program_institution_mismatch":
          return Response.json(
            { error: "Programs must belong to the same institution" },
            { status: 400 },
          );
        case "duplicate_name_and_type":
          return Response.json(
            { error: "Program already exists in the catalog" },
            { status: 409 },
          );
        case "duplicate_code":
          return Response.json(
            { error: "Course code already exists for this institution" },
            { status: 409 },
          );
      }
    }

    await runCatalogSubmissionSideEffects(result.result);

    return Response.json({ status: result.result.status });
  } catch (err) {
    console.error("Moderation catalog submission update failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
