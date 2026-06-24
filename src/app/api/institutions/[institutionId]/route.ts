import { auth } from "@clerk/nextjs/server";

import {
  deleteInstitution,
  getInstitutionById,
  parseInstitutionUpdate,
  serializeInstitution,
  updateInstitution,
} from "@/lib/institutions";
import { logError } from "@/lib/logger";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ institutionId: string }> },
) {
  const { institutionId } = await params;

  try {
    const result = await getInstitutionById(institutionId);

    if (!result.success) {
      return Response.json({ error: "Institution not found" }, { status: 404 });
    }

    return Response.json({
      institution: serializeInstitution(result.institution),
    });
  } catch (err) {
    logError("Institution fetch failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ institutionId: string }> },
) {
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

  const { institutionId } = await params;

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseInstitutionUpdate(body);

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
    const result = await updateInstitution(institutionId, parsed.data);

    if (result.success) {
      return Response.json({
        institution: serializeInstitution(result.institution),
      });
    }

    switch (result.error) {
      case "not_found":
        return Response.json(
          { error: "Institution not found" },
          { status: 404 },
        );
      case "duplicate_name":
        return Response.json(
          { error: "Institution name already exists" },
          { status: 409 },
        );
    }
  } catch (err) {
    logError("Institution update failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ institutionId: string }> },
) {
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

  const { institutionId } = await params;

  try {
    const result = await deleteInstitution(institutionId);

    if (!result.success) {
      switch (result.error) {
        case "not_found":
          return Response.json(
            { error: "Institution not found" },
            { status: 404 },
          );
        case "has_programs":
          return Response.json(
            { error: "Cannot delete institution with linked programs" },
            { status: 409 },
          );
      }
    }

    return Response.json({ success: true });
  } catch (err) {
    logError("Institution delete failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
