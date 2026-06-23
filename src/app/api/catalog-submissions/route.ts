import { auth } from "@clerk/nextjs/server";

import {
  createCatalogSubmission,
  listMyCatalogSubmissions,
  parseCatalogSubmissionCreate,
  serializeCatalogSubmission,
} from "@/lib/catalog-submissions";
import { logError } from "@/lib/logger";
import {
  checkRateLimit,
  getCatalogSubmissionCreateRateLimitOptions,
} from "@/lib/rate-limit";
import { requireContributor } from "@/lib/require-contributor";
import { CatalogSubmissionStatus } from "../../../../generated/prisma/enums";

export const runtime = "nodejs";

function parseStatus(value: string) {
  if (
    value === CatalogSubmissionStatus.PENDING ||
    value === CatalogSubmissionStatus.APPROVED ||
    value === CatalogSubmissionStatus.REJECTED
  ) {
    return value;
  }

  return null;
}

export async function GET(req: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contributorResult = await requireContributor(userId);

  if (!contributorResult.success) {
    switch (contributorResult.error) {
      case "not_found":
        return Response.json({ error: "User not found" }, { status: 404 });
      case "forbidden":
        return Response.json({ error: "Forbidden" }, { status: 403 });
      default:
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const institutionId = searchParams.get("institutionId")?.trim() || undefined;
  const statusParam = searchParams.get("status");
  let status:
    | (typeof CatalogSubmissionStatus)[keyof typeof CatalogSubmissionStatus]
    | undefined;

  if (statusParam) {
    const parsedStatus = parseStatus(statusParam);

    if (!parsedStatus) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    status = parsedStatus;
  }

  try {
    const submissions = await listMyCatalogSubmissions({
      submitterId: userId,
      institutionId,
      status,
    });

    return Response.json({
      submissions: submissions.map(serializeCatalogSubmission),
    });
  } catch (err) {
    logError("Catalog submission list failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contributorResult = await requireContributor(userId);

  if (!contributorResult.success) {
    switch (contributorResult.error) {
      case "not_found":
        return Response.json({ error: "User not found" }, { status: 404 });
      case "forbidden":
        return Response.json({ error: "Forbidden" }, { status: 403 });
      default:
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const createRateLimit = await checkRateLimit(
    `catalog-submission-create:${userId}`,
    getCatalogSubmissionCreateRateLimitOptions(),
  );

  if (createRateLimit.rateLimited) {
    return Response.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: createRateLimit.retryAfterSeconds
          ? { "Retry-After": String(createRateLimit.retryAfterSeconds) }
          : undefined,
      },
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseCatalogSubmissionCreate(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid catalog submission payload" },
      { status: 400 },
    );
  }

  try {
    const result = await createCatalogSubmission(userId, parsed.data);

    if (!result.success) {
      switch (result.error) {
        case "institution_not_found":
          return Response.json(
            { error: "Institution not found" },
            { status: 404 },
          );
        case "duplicate_live_program":
          return Response.json(
            { error: "This program already exists in the catalog" },
            { status: 409 },
          );
        case "duplicate_pending_program":
          return Response.json(
            { error: "This program is already pending review" },
            { status: 409 },
          );
        case "duplicate_live_course":
          return Response.json(
            { error: "This course code already exists for this institution" },
            { status: 409 },
          );
        case "duplicate_pending_course":
          return Response.json(
            { error: "This course is already pending review" },
            { status: 409 },
          );
        case "program_not_found":
          return Response.json({ error: "Program not found" }, { status: 404 });
        case "program_institution_mismatch":
          return Response.json(
            { error: "Programs must belong to the same institution" },
            { status: 400 },
          );
        case "duplicate_code":
          return Response.json(
            { error: "This course code already exists for this institution" },
            { status: 409 },
          );
      }
    }

    return Response.json(
      { submission: serializeCatalogSubmission(result.submission) },
      { status: 201 },
    );
  } catch (err) {
    logError("Catalog submission create failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
