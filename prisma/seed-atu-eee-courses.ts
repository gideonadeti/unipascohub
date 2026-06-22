import {
  ATU_EEE_PROGRAM_NAME,
  ATU_EEE_PROGRAM_TYPE,
  ATU_INSTITUTION_NAME,
} from "./lib/atu-seed-constants";
import { runSeed } from "./lib/seed-prisma";

const LEVEL_100_SEMESTER_1_COURSES = [
  { code: "ATU 111", title: "AFRICA AND WORLD DEVELOPMENT" },
  { code: "BEE 103", title: "APPLIED ELECTRICITY" },
  { code: "ATU 103", title: "COMMUNICATION SKILLS I" },
  { code: "BEE 123", title: "ELECTRICAL ENGINEERING LAB I" },
  { code: "BEE 121", title: "ENGINEERING DRAWING" },
  { code: "BEE 115", title: "ENGINEERING ETHICS I" },
  { code: "BEE 119", title: "GENERAL PHYSICS" },
  { code: "BEE 105", title: "INFORMATION COMMUNICATION TECHNOLOGY" },
  { code: "BEE 107", title: "MATHEMATICS FOR ENGINEERS I (ALGEBRA)" },
  { code: "BEE 117", title: "THERMODYNAMICS" },
] as const;

void runSeed(async (prisma) => {
  const institution = await prisma.institution.findUnique({
    where: { name: ATU_INSTITUTION_NAME },
  });

  if (!institution) {
    throw new Error(
      `${ATU_INSTITUTION_NAME} not found. Run \`pnpm seed-institutions\` first.`,
    );
  }

  const program = await prisma.program.findUnique({
    where: {
      institutionId_name_type: {
        institutionId: institution.id,
        name: ATU_EEE_PROGRAM_NAME,
        type: ATU_EEE_PROGRAM_TYPE,
      },
    },
  });

  if (!program) {
    throw new Error(
      `${ATU_EEE_PROGRAM_NAME} (${ATU_EEE_PROGRAM_TYPE}) not found at ${ATU_INSTITUTION_NAME}. Run \`pnpm seed-atu-programs\` first.`,
    );
  }

  for (const course of LEVEL_100_SEMESTER_1_COURSES) {
    await prisma.course.upsert({
      where: {
        institutionId_code: {
          institutionId: institution.id,
          code: course.code,
        },
      },
      update: {
        title: course.title,
        programs: { connect: { id: program.id } },
      },
      create: {
        institutionId: institution.id,
        code: course.code,
        title: course.title,
        programs: { connect: { id: program.id } },
      },
    });
  }

  console.log(
    `Seeded ${LEVEL_100_SEMESTER_1_COURSES.length} Level 100 Semester 1 courses for ${program.name} at ${ATU_INSTITUTION_NAME}.`,
  );
});
