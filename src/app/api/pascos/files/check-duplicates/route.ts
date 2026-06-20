import { auth } from "@clerk/nextjs/server";
import { formatDuplicateFilesMessage } from "@/lib/content-hash";
import { prisma } from "@/lib/db";
import {
  checkPascoFileDuplicates,
  getPascoMaxFilesPerPasco,
  parsePascoFileDuplicateCheck,
} from "@/lib/pascos";
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

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parsePascoFileDuplicateCheck(body);

  if (!parsed.success) {
    switch (parsed.error) {
      case "invalid_body":
        return Response.json(
          {
            error:
              "Request must include courseId and a non-empty contentHashes array",
          },
          { status: 400 },
        );
      case "invalid_course_id":
        return Response.json({ error: "Invalid courseId" }, { status: 400 });
      case "invalid_content_hashes":
        return Response.json(
          { error: "Invalid contentHashes (expected SHA-256 hex strings)" },
          { status: 400 },
        );
      case "too_many_hashes":
        return Response.json(
          {
            error: `contentHashes cannot contain more than ${getPascoMaxFilesPerPasco()} entries`,
          },
          { status: 400 },
        );
    }
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { id: true },
  });

  if (!course) {
    return Response.json({ error: "Course not found" }, { status: 404 });
  }

  const duplicates = await checkPascoFileDuplicates(parsed.data.contentHashes);

  return Response.json({
    duplicates,
    ...(duplicates.length > 0 && {
      message: formatDuplicateFilesMessage(duplicates),
    }),
  });
}
