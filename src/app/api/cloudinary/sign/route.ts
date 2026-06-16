import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { parseSignUploadInput, signUploadParams } from "@/lib/cloudinary";
import { getCourseById } from "@/lib/courses";
import {
  checkRateLimit,
  getCloudinarySignRateLimitOptions,
} from "@/lib/rate-limit";
import { requireContributor } from "@/lib/require-contributor";

export const runtime = "nodejs";

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
    }
  }

  const rateLimitResult = await checkRateLimit(
    `cloudinary-sign:${userId}`,
    getCloudinarySignRateLimitOptions(),
  );

  if (rateLimitResult.rateLimited) {
    const headers =
      rateLimitResult.retryAfterSeconds !== undefined
        ? { "Retry-After": String(rateLimitResult.retryAfterSeconds) }
        : undefined;

    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers },
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseSignUploadInput(body);

  if (!parsed.success) {
    switch (parsed.error) {
      case "invalid_body":
        return Response.json(
          {
            error: "Request must include courseId, resourceType, and mimeType",
          },
          { status: 400 },
        );
      case "invalid_course_id":
        return Response.json({ error: "Invalid courseId" }, { status: 400 });
      case "invalid_resource_type":
        return Response.json(
          { error: "Invalid resourceType" },
          { status: 400 },
        );
      case "invalid_mime_type":
        return Response.json({ error: "Invalid mimeType" }, { status: 400 });
      case "invalid_pdf_resource_type":
        return Response.json(
          { error: "PDFs must use resourceType IMAGE" },
          { status: 400 },
        );
    }
  }

  const courseResult = await getCourseById(parsed.data.courseId);

  if (!courseResult.success) {
    return Response.json({ error: "Course not found" }, { status: 404 });
  }

  const signResult = signUploadParams(parsed.data);

  if (!signResult.success) {
    return Response.json(
      { error: "Cloudinary is not configured" },
      { status: 500 },
    );
  }

  return Response.json(signResult.data);
}
