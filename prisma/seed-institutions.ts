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
  );

  console.log(
    `Seeded ${names.length} institutions from ${GHANA_INSTITUTIONS_SOURCE_URL}`,
  );
});
