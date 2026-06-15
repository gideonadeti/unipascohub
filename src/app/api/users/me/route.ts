import { auth } from "@clerk/nextjs/server";

import {
  getUserProfile,
  parseProfileUpdate,
  serializeProfileUser,
  updateUserProfile,
} from "@/lib/user-profile";

export const runtime = "nodejs";

export async function GET() {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await getUserProfile(userId);

    if (!result.success) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ user: serializeProfileUser(result.user) });
  } catch (err) {
    console.error("Profile fetch failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseProfileUpdate(body);

  if (!parsed.success) {
    switch (parsed.error) {
      case "invalid_body":
        return Response.json(
          { error: "Request must include school and/or educationLevel" },
          { status: 400 },
        );
      case "invalid_school":
        return Response.json({ error: "Invalid school" }, { status: 400 });
      case "invalid_education_level":
        return Response.json(
          {
            error:
              "Invalid educationLevel. Must be one of: JHS, SHS, UNDERGRADUATE, POSTGRADUATE, OTHER",
          },
          { status: 400 },
        );
    }
  }

  try {
    const result = await updateUserProfile(userId, parsed.data);

    if (!result.success) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ user: serializeProfileUser(result.user) });
  } catch (err) {
    console.error("Profile update failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
