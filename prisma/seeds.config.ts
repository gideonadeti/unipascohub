/**
 * Registry of database seed scripts. Each entry should have a matching
 * `seed-<name>` script in package.json that runs `tsx prisma/seed-<name>.ts`.
 */
export const seedScripts = {
  institutions: {
    file: "prisma/seed-institutions.ts",
    description:
      "Upsert Ghanaian institutions from Wikipedia (see prisma/data/).",
  },
} as const satisfies Record<string, { file: string; description: string }>;

export type SeedScriptName = keyof typeof seedScripts;
