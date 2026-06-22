import type {
  EducationLevel,
  PascoType,
  SemesterType,
  StudyMode,
} from "@/types/api/pascos";

export const PASCO_TYPE_SYNONYMS: ReadonlyArray<{
  pattern: RegExp;
  value: PascoType;
  label: string;
}> = [
  { pattern: /\bend\s+of\s+sem\b/i, value: "END_OF_SEM", label: "End of sem" },
  { pattern: /\beos\b/i, value: "END_OF_SEM", label: "End of sem" },
  { pattern: /\bfinals?\b/i, value: "END_OF_SEM", label: "End of sem" },
  { pattern: /\bmid\s*sem\b/i, value: "MID_SEM", label: "Mid sem" },
  { pattern: /\bmidsem\b/i, value: "MID_SEM", label: "Mid sem" },
  { pattern: /\bresit\b/i, value: "RESIT", label: "Resit" },
];

export const SEMESTER_TYPE_SYNONYMS: ReadonlyArray<{
  pattern: RegExp;
  value: SemesterType;
  label: string;
}> = [
  {
    pattern: /\bfirst\s+sem\b/i,
    value: "FIRST_SEMESTER",
    label: "First sem",
  },
  { pattern: /\bsem\s*1\b/i, value: "FIRST_SEMESTER", label: "First sem" },
  {
    pattern: /\bsecond\s+sem\b/i,
    value: "SECOND_SEMESTER",
    label: "Second sem",
  },
  { pattern: /\bsem\s*2\b/i, value: "SECOND_SEMESTER", label: "Second sem" },
];

export const EDUCATION_LEVEL_BY_NUMBER: Record<number, EducationLevel> = {
  100: "LEVEL_100",
  200: "LEVEL_200",
  300: "LEVEL_300",
  400: "LEVEL_400",
};

export const EDUCATION_LEVEL_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  level: EducationLevel;
  label: string;
}> = [
  {
    pattern: /\blevel\s*100\b/i,
    level: "LEVEL_100",
    label: "Level 100",
  },
  {
    pattern: /\bl\s*100\b/i,
    level: "LEVEL_100",
    label: "Level 100",
  },
  {
    pattern: /\b100\s+level\b/i,
    level: "LEVEL_100",
    label: "Level 100",
  },
  {
    pattern: /\blevel\s*200\b/i,
    level: "LEVEL_200",
    label: "Level 200",
  },
  {
    pattern: /\bl\s*200\b/i,
    level: "LEVEL_200",
    label: "Level 200",
  },
  {
    pattern: /\b200\s+level\b/i,
    level: "LEVEL_200",
    label: "Level 200",
  },
  {
    pattern: /\blevel\s*300\b/i,
    level: "LEVEL_300",
    label: "Level 300",
  },
  {
    pattern: /\bl\s*300\b/i,
    level: "LEVEL_300",
    label: "Level 300",
  },
  {
    pattern: /\b300\s+level\b/i,
    level: "LEVEL_300",
    label: "Level 300",
  },
  {
    pattern: /\blevel\s*400\b/i,
    level: "LEVEL_400",
    label: "Level 400",
  },
  {
    pattern: /\bl\s*400\b/i,
    level: "LEVEL_400",
    label: "Level 400",
  },
  {
    pattern: /\b400\s+level\b/i,
    level: "LEVEL_400",
    label: "Level 400",
  },
];

export const STUDY_MODE_SYNONYMS: ReadonlyArray<{
  pattern: RegExp;
  value: StudyMode;
  label: string;
}> = [
  {
    pattern: /\bfull\s*time\b/i,
    value: "FULL_TIME",
    label: "Full time",
  },
  {
    pattern: /\bregular\b/i,
    value: "FULL_TIME",
    label: "Full time",
  },
  {
    pattern: /\bpart\s*time\b/i,
    value: "PART_TIME",
    label: "Part time",
  },
  {
    pattern: /\bdistance\b/i,
    value: "DISTANCE",
    label: "Distance",
  },
  {
    pattern: /\bweekend\b/i,
    value: "WEEKEND",
    label: "Weekend",
  },
  {
    pattern: /\bevening\b/i,
    value: "EVENING",
    label: "Evening",
  },
];

/** Matches academic years like 2024/2025 or 2024-2025 */
export const ACADEMIC_YEAR_PATTERN = /\b(\d{4})[/-](\d{4})\b/;

/** Matches course codes like DCIT 101, MATH201 */
export const COURSE_CODE_PATTERN = /\b([A-Za-z]{2,})\s*(\d{2,3})\b/g;
