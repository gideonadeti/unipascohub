import { auth } from "@clerk/nextjs/server";
import { logError } from "@/lib/logger";
import { upgradeUserToContributor } from "@/lib/user-roles";

export const runtime = "nodejs";

export async function POST(_req: Request) {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await upgradeUserToContributor(userId);

    if (!result.success) {
      switch (result.error) {
        case "not_found":
          return Response.json({ error: "User not found" }, { status: 404 });
        case "already_upgraded":
          return Response.json(
            { error: "Already a contributor" },
            { status: 409 },
          );
        case "forbidden":
          return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return Response.json({
      user: {
        id: result.user.id,
        role: result.user.role,
      },
    });
  } catch (err) {
    logError("Contributor upgrade failed", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
