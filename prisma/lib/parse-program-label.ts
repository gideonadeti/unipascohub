import { ProgramType } from "../../generated/prisma/enums";

export type ParsedProgram = {
  name: string;
  type: ProgramType;
};

export type AtuProgramsData = {
  faculties: {
    faculty_name: string;
    departments: {
      department_name: string;
      programs: string[];
    }[];
  }[];
};

const TOP_UP_PREFIX = "2-Year BTech (Top-Up) ";
const BTECH_PREFIX = "4-Year BTech ";
const HND_PREFIX = "HND ";
const BSC_PREFIX = "4-Year BSc ";

export function parseProgramLabel(raw: string): ParsedProgram | null {
  if (raw.includes("Technician Part")) {
    return null;
  }

  if (raw.startsWith(TOP_UP_PREFIX)) {
    return {
      name: raw.slice(TOP_UP_PREFIX.length).trim(),
      type: ProgramType.BTECH_TOP_UP,
    };
  }

  if (raw.startsWith(BTECH_PREFIX)) {
    return {
      name: raw.slice(BTECH_PREFIX.length).trim(),
      type: ProgramType.BTECH,
    };
  }

  if (raw.startsWith(HND_PREFIX)) {
    return {
      name: raw.slice(HND_PREFIX.length).trim(),
      type: ProgramType.HND,
    };
  }

  if (raw.startsWith(BSC_PREFIX)) {
    return {
      name: raw.slice(BSC_PREFIX.length).trim(),
      type: ProgramType.BACHELOR,
    };
  }

  return null;
}

export function flattenPrograms(data: AtuProgramsData): {
  programs: ParsedProgram[];
  skipped: string[];
  unrecognized: string[];
} {
  const programs: ParsedProgram[] = [];
  const skipped: string[] = [];
  const unrecognized: string[] = [];
  const seen = new Set<string>();

  for (const faculty of data.faculties) {
    for (const department of faculty.departments) {
      for (const label of department.programs) {
        const parsed = parseProgramLabel(label);

        if (parsed === null) {
          if (label.includes("Technician Part")) {
            skipped.push(label);
          } else {
            unrecognized.push(label);
          }
          continue;
        }

        const key = `${parsed.name}|${parsed.type}`;
        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        programs.push(parsed);
      }
    }
  }

  return { programs, skipped, unrecognized };
}
