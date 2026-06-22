/**
 * Registry of database seed scripts. Each entry should have a matching
 * `seed-*` script in package.json.
 */
export const seedScripts = {
  institutions: {
    file: "prisma/seed-institutions.ts",
    command: "pnpm seed-institutions",
    description:
      "Upsert Ghanaian institutions from Wikipedia (see prisma/data/).",
  },
  "atu-programs": {
    file: "prisma/seed-atu-programs.ts",
    command: "pnpm seed-atu-programs",
    description:
      "Upsert programs for Accra Technical University (see prisma/data/atu-programs.json).",
  },
  "atu-eee-courses": {
    file: "prisma/seed-atu-eee-courses.ts",
    command: "pnpm seed-atu-eee-courses",
    description:
      "Upsert Level 100 Semester 1 courses for ATU BTech Electrical and Electronic Engineering.",
  },
} as const satisfies Record<
  string,
  { file: string; command: string; description: string }
>;

export type SeedScriptName = keyof typeof seedScripts;
