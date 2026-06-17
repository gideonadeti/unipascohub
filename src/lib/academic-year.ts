export const ACADEMIC_YEAR_LOOKBACK = 10;

/** Academic year starts in September (month index 8). */
export function getCurrentAcademicStartYear(date = new Date()): number {
  const year = date.getFullYear();
  return date.getMonth() >= 8 ? year : year - 1;
}

export function formatAcademicYear(startYear: number): string {
  return `${startYear}/${startYear + 1}`;
}

export function parseAcademicYearValue(
  value: string,
): { startYear: number; endYear: number } | null {
  const match = /^(\d{4})\/(\d{4})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const startYear = Number.parseInt(match[1], 10);
  const endYear = Number.parseInt(match[2], 10);

  if (endYear !== startYear + 1) {
    return null;
  }

  return { startYear, endYear };
}

export function buildAcademicYearOptions(
  lookback = ACADEMIC_YEAR_LOOKBACK,
  date = new Date(),
): string[] {
  const currentStart = getCurrentAcademicStartYear(date);
  const options: string[] = [];

  for (
    let startYear = currentStart;
    startYear >= currentStart - lookback;
    startYear--
  ) {
    options.push(formatAcademicYear(startYear));
  }

  return options;
}

export const ACADEMIC_YEAR_OPTIONS = buildAcademicYearOptions();

export function isValidAcademicYear(value: string, date = new Date()): boolean {
  const parsed = parseAcademicYearValue(value);

  if (!parsed) {
    return false;
  }

  const currentStart = getCurrentAcademicStartYear(date);
  const minStart = currentStart - ACADEMIC_YEAR_LOOKBACK;

  return parsed.startYear >= minStart && parsed.startYear <= currentStart;
}

export function academicYearValidationMessage(value: string): string | null {
  const parsed = parseAcademicYearValue(value);

  if (!parsed) {
    return "Use format YYYY/YYYY (e.g. 2025/2026)";
  }

  if (parsed.endYear !== parsed.startYear + 1) {
    return "End year must be one year after the start year";
  }

  const currentStart = getCurrentAcademicStartYear();
  const minStart = currentStart - ACADEMIC_YEAR_LOOKBACK;

  if (parsed.startYear > currentStart) {
    return "Academic year cannot be in the future";
  }

  if (parsed.startYear < minStart) {
    return `Academic year must be ${formatAcademicYear(minStart)} or later`;
  }

  return null;
}
