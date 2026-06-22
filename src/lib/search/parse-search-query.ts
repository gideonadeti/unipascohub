import { formatAcademicYear, isValidAcademicYear } from "@/lib/academic-year";
import { formatEnumLabel } from "@/lib/catalog-labels";
import type { PascoListFilters } from "@/types/api/pascos";

import {
  ACADEMIC_YEAR_PATTERN,
  COURSE_CODE_PATTERN,
  EDUCATION_LEVEL_BY_NUMBER,
  EDUCATION_LEVEL_PATTERNS,
  PASCO_TYPE_SYNONYMS,
  SEMESTER_TYPE_SYNONYMS,
  STUDY_MODE_SYNONYMS,
} from "./search-synonyms";

const BARE_LEVEL_PATTERN = /^(100|200|300|400)$/;

export type ParsedToken = {
  key: keyof PascoListFilters | "courseQuery";
  value: string;
  label: string;
};

export type ParseSearchQueryResult = {
  filters: Partial<PascoListFilters>;
  courseQuery?: string;
  tokens: ParsedToken[];
};

export function normalizeCourseCode(raw: string): string {
  const match = /^([A-Za-z]{2,})\s*(\d{2,3})$/.exec(raw.trim());

  if (!match) {
    return raw.trim().toUpperCase();
  }

  return `${match[1].toUpperCase()} ${match[2]}`;
}

function removeSpan(text: string, start: number, length: number): string {
  return `${text.slice(0, start)}${" ".repeat(length)}${text.slice(start + length)}`;
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function parseAcademicYearToken(
  text: string,
  filters: Partial<PascoListFilters>,
  tokens: ParsedToken[],
): string {
  const match = ACADEMIC_YEAR_PATTERN.exec(text);

  if (!match) {
    return text;
  }

  const academicYear = `${match[1]}/${match[2]}`;

  if (!isValidAcademicYear(academicYear)) {
    return text;
  }

  filters.academicYear = academicYear;
  tokens.push({
    key: "academicYear",
    value: academicYear,
    label: academicYear,
  });

  return removeSpan(text, match.index, match[0].length);
}

function parseEducationLevel(
  text: string,
  filters: Partial<PascoListFilters>,
  tokens: ParsedToken[],
): string {
  let working = text;

  for (const entry of EDUCATION_LEVEL_PATTERNS) {
    const match = entry.pattern.exec(working);

    if (!match) {
      continue;
    }

    filters.educationLevel = entry.level;
    tokens.push({
      key: "educationLevel",
      value: entry.level,
      label: entry.label,
    });

    working = removeSpan(working, match.index, match[0].length);
    break;
  }

  return working;
}

function parsePascoType(
  text: string,
  filters: Partial<PascoListFilters>,
  tokens: ParsedToken[],
): string {
  let working = text;

  for (const entry of PASCO_TYPE_SYNONYMS) {
    const match = entry.pattern.exec(working);

    if (!match) {
      continue;
    }

    filters.type = entry.value;
    tokens.push({
      key: "type",
      value: entry.value,
      label: entry.label,
    });

    working = removeSpan(working, match.index, match[0].length);
    break;
  }

  return working;
}

function parseSemesterType(
  text: string,
  filters: Partial<PascoListFilters>,
  tokens: ParsedToken[],
): string {
  let working = text;

  for (const entry of SEMESTER_TYPE_SYNONYMS) {
    const match = entry.pattern.exec(working);

    if (!match) {
      continue;
    }

    filters.semesterType = entry.value;
    tokens.push({
      key: "semesterType",
      value: entry.value,
      label: entry.label,
    });

    working = removeSpan(working, match.index, match[0].length);
    break;
  }

  return working;
}

function parseStudyMode(
  text: string,
  filters: Partial<PascoListFilters>,
  tokens: ParsedToken[],
): string {
  let working = text;

  for (const entry of STUDY_MODE_SYNONYMS) {
    const match = entry.pattern.exec(working);

    if (!match) {
      continue;
    }

    filters.studyMode = entry.value;
    tokens.push({
      key: "studyMode",
      value: entry.value,
      label: entry.label,
    });

    working = removeSpan(working, match.index, match[0].length);
    break;
  }

  return working;
}

function consumeBareLeftoverFilters(
  text: string,
  filters: Partial<PascoListFilters>,
  tokens: ParsedToken[],
): string {
  const collapsed = collapseWhitespace(text);

  const bareYear = tryExpandSingleYear(collapsed);
  if (bareYear) {
    if (!filters.academicYear) {
      filters.academicYear = bareYear;
      tokens.push({
        key: "academicYear",
        value: bareYear,
        label: bareYear,
      });
    }

    return "";
  }

  const bareLevelMatch = BARE_LEVEL_PATTERN.exec(collapsed);
  if (bareLevelMatch && collapsed === bareLevelMatch[0]) {
    const levelNumber = Number.parseInt(bareLevelMatch[1], 10);
    const educationLevel = EDUCATION_LEVEL_BY_NUMBER[levelNumber];

    if (educationLevel && !filters.educationLevel) {
      filters.educationLevel = educationLevel;
      tokens.push({
        key: "educationLevel",
        value: educationLevel,
        label: `Level ${levelNumber}`,
      });
    }

    return "";
  }

  return collapsed;
}

function extractCourseQuery(
  text: string,
  tokens: ParsedToken[],
  filters: Partial<PascoListFilters>,
): string | undefined {
  const matches = [...text.matchAll(COURSE_CODE_PATTERN)];

  if (matches.length === 0) {
    const consumed = consumeBareLeftoverFilters(text, filters, tokens);

    return consumed.length > 0 ? consumed : undefined;
  }

  const lastMatch = matches.at(-1);

  if (!lastMatch) {
    return undefined;
  }

  const courseQuery = normalizeCourseCode(`${lastMatch[1]} ${lastMatch[2]}`);

  tokens.push({
    key: "courseQuery",
    value: courseQuery,
    label: courseQuery,
  });

  const withoutCode = collapseWhitespace(
    text.replace(COURSE_CODE_PATTERN, " "),
  );
  const consumedLeftover = consumeBareLeftoverFilters(
    withoutCode,
    filters,
    tokens,
  );

  if (consumedLeftover.length > 0 && consumedLeftover !== courseQuery) {
    return `${courseQuery} ${consumedLeftover}`.trim();
  }

  return courseQuery;
}

export function parseSearchQuery(raw: string): ParseSearchQueryResult {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return { filters: {}, tokens: [] };
  }

  const filters: Partial<PascoListFilters> = {};
  const tokens: ParsedToken[] = [];

  const bareYear = tryExpandSingleYear(trimmed);
  if (bareYear) {
    filters.academicYear = bareYear;
    tokens.push({
      key: "academicYear",
      value: bareYear,
      label: bareYear,
    });

    return { filters, tokens };
  }

  const bareLevelMatch = BARE_LEVEL_PATTERN.exec(trimmed);
  if (bareLevelMatch) {
    const levelNumber = Number.parseInt(bareLevelMatch[1], 10);
    const educationLevel = EDUCATION_LEVEL_BY_NUMBER[levelNumber];

    if (educationLevel) {
      filters.educationLevel = educationLevel;
      tokens.push({
        key: "educationLevel",
        value: educationLevel,
        label: `Level ${levelNumber}`,
      });

      return { filters, tokens };
    }
  }

  let working = trimmed;
  working = parseAcademicYearToken(working, filters, tokens);
  working = parseEducationLevel(working, filters, tokens);
  working = parseStudyMode(working, filters, tokens);
  working = parsePascoType(working, filters, tokens);
  working = parseSemesterType(working, filters, tokens);

  const courseQuery = extractCourseQuery(working, tokens, filters);

  return {
    filters,
    courseQuery,
    tokens,
  };
}

export function formatParsedFilterLabel(
  key: keyof PascoListFilters,
  value: string,
): string {
  if (key === "academicYear") {
    return value;
  }

  return formatEnumLabel(value);
}

/** Re-export for callers that need a single-year shortcut like "2024" → "2024/2025" */
export function tryExpandSingleYear(value: string): string | null {
  const match = /^(\d{4})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const startYear = Number.parseInt(match[1], 10);
  const academicYear = formatAcademicYear(startYear);

  return isValidAcademicYear(academicYear) ? academicYear : null;
}
