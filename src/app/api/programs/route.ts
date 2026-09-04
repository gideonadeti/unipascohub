import { auth } from "@clerk/nextjs/server";
import { logError } from "@/lib/logger";
import {
  createProgram,
  listPrograms,
  parseProgramCreate,
  serializeProgram,
} from "@/lib/programs";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const institutionId = url.searchParams.get("institutionId");

  try {
    const result = await listPrograms({
      institutionId: institutionId ?? undefined,
    });

    if (!result.success) {
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }

    return Response.json(
      {
        programs: result.programs.map(serializeProgram),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    logError("Program list failed", err);

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

  const parsed = parseProgramCreate(body);

  if (!parsed.success) {
    switch (parsed.error) {
      case "invalid_body":
        return Response.json(
          { error: "Request must include institutionId, name, and type" },
          { status: 400 },
        );
      case "invalid_institution_id":
        return Response.json(
          { error: "Invalid institutionId" },
          { status: 400 },
        );
      case "invalid_name":
        return Response.json({ error: "Invalid name" }, { status: 400 });
      case "invalid_type":
        return Response.json({ error: "Invalid type" }, { status: 400 });
    }
  }

  try {
    const result = await createProgram(parsed.data);

    if (!result.success) {
      switch (result.error) {
        case "institution_not_found":
          return Response.json(
            { error: "Institution not found" },
            { status: 404 },
          );
        case "duplicate_name_and_type":
          return Response.json(
            { error: "Program already exists for this institution/type" },
            { status: 409 },
          );
      }
    }

    return Response.json(
      { program: serializeProgram(result.program) },
      { status: 201 },
    );
  } catch (err) {
    logError("Program create failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
