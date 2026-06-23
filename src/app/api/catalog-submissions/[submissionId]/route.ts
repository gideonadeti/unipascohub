import { auth } from "@clerk/nextjs/server";

import {
  deleteCatalogSubmission,
  resubmitCatalogSubmission,
  type UpdateCatalogSubmissionFields,
} from "@/lib/catalog-submissions";
import { logError } from "@/lib/logger";
import { createCatalogSubmissionPendingNotifications } from "@/lib/notifications";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { submissionId } = await params;

  let body: UpdateCatalogSubmissionFields | undefined;

  try {
    const text = await req.text();
    if (text) {
      body = JSON.parse(text) as UpdateCatalogSubmissionFields;
    }
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await resubmitCatalogSubmission(submissionId, userId, body);

    if (!result.success) {
      switch (result.error) {
        case "not_found":
          return Response.json(
            { error: "Submission not found" },
            { status: 404 },
          );
        case "not_rejected":
          return Response.json(
            { error: "Only rejected submissions can be resubmitted" },
            { status: 409 },
          );
        case "not_owner":
          return Response.json(
            { error: "You can only resubmit your own submissions" },
            { status: 403 },
          );
      }
    }

    // Notify moderators about the resubmitted request
    const label = body
      ? "A rejected submission has been edited and resubmitted"
      : "A previously rejected submission has been resubmitted";
    await createCatalogSubmissionPendingNotifications(label);

    return Response.json({ status: result.result.status });
  } catch (err) {
    logError("Resubmit catalog submission failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { submissionId } = await params;

  try {
    const result = await deleteCatalogSubmission(submissionId, userId);

    if (!result.success) {
      switch (result.error) {
        case "not_found":
          return Response.json(
            { error: "Submission not found" },
            { status: 404 },
          );
        case "not_owner":
          return Response.json(
            { error: "You can only delete your own submissions" },
            { status: 403 },
          );
        case "not_rejected":
          return Response.json(
            { error: "Only rejected submissions can be deleted" },
            { status: 409 },
          );
      }
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    logError("Delete catalog submission failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
