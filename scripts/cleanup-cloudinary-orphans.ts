import "dotenv/config";

import { cleanupOrphanCloudinaryAssets } from "@/lib/cloudinary-orphans";

function parseArgs(argv: string[]): { execute: boolean; courseId?: string } {
  let execute = false;
  let courseId: string | undefined;

  for (const arg of argv) {
    if (arg === "--execute") {
      execute = true;
      continue;
    }

    if (arg.startsWith("--course-id=")) {
      const value = arg.slice("--course-id=".length).trim();

      if (value.length > 0) {
        courseId = value;
      }
    }
  }

  return { execute, courseId };
}

async function main() {
  const { execute, courseId } = parseArgs(process.argv.slice(2));
  const dryRun = !execute;

  const result = await cleanupOrphanCloudinaryAssets({
    dryRun,
    courseId,
  });

  console.log(
    JSON.stringify(
      {
        dryRun,
        courseId: courseId ?? null,
        scanned: result.scanned,
        orphanCount: result.orphans.length,
        orphans: result.orphans,
        deleted: result.deleted,
        deleteFailures: result.deleteFailures,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Cloudinary orphan cleanup failed:", error);
  process.exit(1);
});
