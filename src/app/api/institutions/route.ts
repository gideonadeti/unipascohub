import { auth } from "@clerk/nextjs/server";

import {
  createInstitution,
  listInstitutions,
  parseInstitutionCreate,
  serializeInstitution,
} from "@/lib/institutions";
import { logError } from "@/lib/logger";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await listInstitutions();

    if (!result.success) {
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }

    return Response.json(
      {
        institutions: result.institutions.map(serializeInstitution),
      },
      { headers: { "Cache-Control": "public, max-age=3600" } },
    );
  } catch (err) {
    logError("Institution list failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminResult = await requireAdmin(userId);

  if (!adminResult.success) {
    switch (adminResult.error) {
      case "not_found":
        return Response.json({ error: "User not found" }, { status: 404 });
      case "forbidden":
        return Response.json({ error: "Forbidden" }, { status: 403 });
      default:
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseInstitutionCreate(body);

  if (!parsed.success) {
    switch (parsed.error) {
      case "invalid_body":
        return Response.json(
          { error: "Request must include a name" },
          { status: 400 },
        );
      case "invalid_name":
        return Response.json({ error: "Invalid name" }, { status: 400 });
    }
  }

  try {
    const result = await createInstitution(parsed.data);

    if (!result.success) {
      return Response.json(
        { error: "Institution name already exists" },
        { status: 409 },
      );
    }

    return Response.json(
      { institution: serializeInstitution(result.institution) },
      { status: 201 },
    );
  } catch (err) {
    logError("Institution create failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
