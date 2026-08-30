import {
  GHANA_INSTITUTIONS_SOURCE_URL,
  loadGhanaInstitutionNames,
} from "./data/parse-wikipedia-institutions";
import { runSeed } from "./lib/seed-prisma";

void runSeed(async (prisma) => {
  const names = loadGhanaInstitutionNames();

  await prisma.$transaction(
    names.map((name) =>
      prisma.institution.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
    // Neon pooler + cold-start latency can push ~90 round-trips past the
    // default 5s interactive transaction timeout (P2028 fails the build).
    { timeout: 60_000, maxWait: 10_000 },
  );

  console.log(
    `Seeded ${names.length} institutions from ${GHANA_INSTITUTIONS_SOURCE_URL}`,
  );
});
