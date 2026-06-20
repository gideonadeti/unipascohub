import { auth } from "@clerk/nextjs/server";

import { promoteUserToModerator } from "@/lib/user-roles";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId: targetUserId } = await params;

  try {
    const result = await promoteUserToModerator(userId, targetUserId);

    if (!result.success) {
      switch (result.error) {
        case "actor_not_found":
          return Response.json({ error: "User not found" }, { status: 404 });
        case "forbidden":
          return Response.json({ error: "Forbidden" }, { status: 403 });
        case "target_not_found":
          return Response.json(
            { error: "Target user not found" },
            { status: 404 },
          );
        case "already_moderator":
          return Response.json(
            { error: "User is already a moderator" },
            { status: 409 },
          );
        case "invalid_target_role":
          return Response.json(
            { error: "Cannot promote an admin to moderator" },
            { status: 403 },
          );
      }
    }

    return Response.json({
      user: {
        id: result.user.id,
        role: result.user.role,
      },
    });
  } catch (err) {
    console.error("Moderator promotion failed:", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
