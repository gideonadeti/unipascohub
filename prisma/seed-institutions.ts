import {
  GHANA_INSTITUTIONS_SOURCE_URL,
  loadGhanaInstitutionNames,
} from "./data/parse-wikipedia-institutions";
import { runSeed } from "./lib/seed-prisma";

void runSeed(async (prisma) => {
  const names = loadGhanaInstitutionNames();

  // Only insert institutions that are missing so established databases skip
  // the heavy work on every deploy while new seed data still propagates.
  const existing = await prisma.institution.findMany({
    where: { name: { in: names } },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((row) => row.name));
  const missing = names.filter((name) => !existingNames.has(name));

  if (missing.length === 0) {
    console.log(
      `Institutions already up to date (${existingNames.size} present); nothing to insert.`,
    );

    return;
  }

  await prisma.$transaction(
    missing.map((name) =>
      prisma.institution.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
    // Neon pooler + cold-start latency can push many round-trips past the
    // default 5s interactive transaction timeout (P2028 fails the build).
    { timeout: 60_000, maxWait: 10_000 },
  );

  console.log(
    `Seeded ${missing.length} new institutions (${existingNames.size} already present) from ${GHANA_INSTITUTIONS_SOURCE_URL}`,
  );
});
