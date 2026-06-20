import { auth } from "@clerk/nextjs/server";

import {
  deleteProgram,
  getProgramById,
  parseProgramUpdate,
  serializeProgram,
  updateProgram,
} from "@/lib/programs";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ programId: string }> },
) {
  const { programId } = await params;

  try {
    const result = await getProgramById(programId);

    if (!result.success) {
      return Response.json({ error: "Program not found" }, { status: 404 });
    }

    return Response.json({
      program: serializeProgram(result.program),
    });
  } catch (err) {
    console.error("Program fetch failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ programId: string }> },
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
    }
  }

  const { programId } = await params;

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseProgramUpdate(body);

  if (!parsed.success) {
    switch (parsed.error) {
      case "invalid_body":
        return Response.json(
          { error: "Request must include at least one of: name, type" },
          { status: 400 },
        );
      case "invalid_name":
        return Response.json({ error: "Invalid name" }, { status: 400 });
      case "invalid_type":
        return Response.json({ error: "Invalid type" }, { status: 400 });
    }
  }

  try {
    const result = await updateProgram(programId, parsed.data);

    if (result.success) {
      return Response.json({
        program: serializeProgram(result.program),
      });
    }

    switch (result.error) {
      case "not_found":
        return Response.json({ error: "Program not found" }, { status: 404 });
      case "duplicate_name_and_type":
        return Response.json(
          { error: "Program already exists for this institution/type" },
          { status: 409 },
        );
    }
  } catch (err) {
    console.error("Program update failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ programId: string }> },
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
    }
  }

  const { programId } = await params;

  try {
    const result = await deleteProgram(programId);

    if (result.success) {
      return Response.json({ success: true });
    }

    switch (result.error) {
      case "not_found":
        return Response.json({ error: "Program not found" }, { status: 404 });
    }
  } catch (err) {
    console.error("Program delete failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
