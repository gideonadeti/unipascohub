import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import {
  GHANA_INSTITUTIONS_SOURCE_URL,
  loadGhanaInstitutionNames,
} from "./data/parse-wikipedia-institutions";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const names = loadGhanaInstitutionNames();

  for (const name of names) {
    await prisma.institution.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(
    `Seeded ${names.length} institutions from ${GHANA_INSTITUTIONS_SOURCE_URL}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
