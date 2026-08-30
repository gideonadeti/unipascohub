import atuPrograms from "./data/atu-programs.json";
import { ATU_INSTITUTION_NAME } from "./lib/atu-seed-constants";
import { flattenPrograms } from "./lib/parse-program-label";
import { runSeed } from "./lib/seed-prisma";

void runSeed(async (prisma) => {
  const institution = await prisma.institution.findUnique({
    where: { name: ATU_INSTITUTION_NAME },
  });

  if (!institution) {
    throw new Error(
      `${ATU_INSTITUTION_NAME} not found. Run \`pnpm seed-institutions\` first.`,
    );
  }

  const { programs, skipped, unrecognized } = flattenPrograms(atuPrograms);

  if (unrecognized.length > 0) {
    console.warn("Unrecognized program labels:");
    for (const label of unrecognized) {
      console.warn(`  - ${label}`);
    }
  }

  let upserted = 0;

  await prisma.$transaction(
    async (tx) => {
      for (const { name, type } of programs) {
        await tx.program.upsert({
          where: {
            institutionId_name_type: {
              institutionId: institution.id,
              name,
              type,
            },
          },
          update: {},
          create: {
            institutionId: institution.id,
            name,
            type,
          },
        });

        upserted++;
      }
      // Default 5s transaction timeout is too tight for a cold Neon compute.
    },
    { timeout: 60_000, maxWait: 10_000 },
  );

  const count = await prisma.program.count({
    where: { institutionId: institution.id },
  });

  console.log(`Seeded programs for ${institution.name}`);
  console.log(`  Upserted: ${upserted}`);
  console.log(`  Skipped (technician): ${skipped.length}`);
  console.log(`  Total in DB: ${count}`);
});
