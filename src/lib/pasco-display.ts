import { formatEnumLabel } from "@/lib/catalog-labels";
import { filtersToSearchParams } from "@/lib/pasco-list-query";
import type { Course } from "@/types/api/catalog";
import type {
  Pasco,
  PascoListFilters,
  PascoListSortBy,
} from "@/types/api/pascos";

type PascoTitleFields = Pick<
  Pasco,
  "academicYear" | "educationLevel" | "courseId" | "semesterType" | "type"
>;

type CourseTitleFields = Pick<Course, "code" | "title">;

export type PascoCardEmphasis = "views" | "downloads" | "likes" | "createdAt";

export type PascoCardBadgeKey = "type" | "contentType";

export type PascoCardBadge = {
  key: string;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
};

export function getPascoDisplayTitle(
  pasco: PascoTitleFields,
  course?: CourseTitleFields | null,
): string {
  if (course) {
    return `${course.code} — ${course.title}`;
  }

  return `${pasco.academicYear} · ${formatEnumLabel(pasco.educationLevel)}`;
}

export function getPascoDisplayDescription(
  pasco: PascoTitleFields,
  course?: CourseTitleFields | null,
): string | undefined {
  if (course) {
    return `${pasco.academicYear} · ${formatEnumLabel(pasco.educationLevel)} · ${formatEnumLabel(pasco.semesterType)} · ${formatEnumLabel(pasco.type)}`;
  }

  return `${formatEnumLabel(pasco.semesterType)} · ${formatEnumLabel(pasco.type)}`;
}

export function getPascoBrowseHref(pasco: Pick<Pasco, "courseId">): string {
  const params = filtersToSearchParams({ courseId: pasco.courseId });
  const query = params.toString();
  return query ? `/pascos?${query}` : "/pascos";
}

export const pascoOverviewBadges = [
  "type",
  "educationLevel",
  "semesterType",
  "contentType",
] as const satisfies ReadonlyArray<keyof Pasco>;

const RELATIVE_TIME_DIVISIONS: Array<{
  amount: number;
  unit: Intl.RelativeTimeFormatUnit;
}> = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.345_24, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

export function formatPascoRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  let delta = (date.getTime() - now) / 1000;

  for (const division of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(delta) < division.amount) {
      return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
        Math.round(delta),
        division.unit,
      );
    }

    delta /= division.amount;
  }

  return date.toLocaleDateString();
}

export function getPascoCardEmphasis(
  sortBy?: PascoListSortBy,
): PascoCardEmphasis {
  switch (sortBy) {
    case "viewCount":
      return "views";
    case "downloadCount":
      return "downloads";
    case "likeCount":
      return "likes";
    default:
      return "createdAt";
  }
}

export function hiddenBadgeKeysFromFilters(
  filters: PascoListFilters,
): PascoCardBadgeKey[] {
  const hidden: PascoCardBadgeKey[] = [];

  if (filters.type) {
    hidden.push("type");
  }

  if (filters.contentType) {
    hidden.push("contentType");
  }

  return hidden;
}

type PascoCardBadgeFields = Pick<
  Pasco,
  "isComplete" | "contentType" | "solutionCompleteness" | "type"
>;

export function getPascoCardBadges(
  pasco: PascoCardBadgeFields,
  options?: { hiddenKeys?: readonly PascoCardBadgeKey[] },
): PascoCardBadge[] {
  const hiddenKeys = new Set(options?.hiddenKeys ?? []);
  const badges: PascoCardBadge[] = [];

  if (!pasco.isComplete) {
    badges.push({
      key: "incomplete",
      label: "Incomplete upload",
      variant: "destructive",
    });
  }

  if (
    pasco.contentType !== "QUESTIONS_ONLY" &&
    !hiddenKeys.has("contentType")
  ) {
    badges.push({
      key: "contentType",
      label: formatEnumLabel(pasco.contentType),
      variant: "secondary",
    });
  }

  if (pasco.solutionCompleteness === "PARTIALLY_SOLVED") {
    badges.push({
      key: "solutionCompleteness",
      label: formatEnumLabel(pasco.solutionCompleteness),
      variant: "outline",
    });
  }

  if (!hiddenKeys.has("type")) {
    badges.push({
      key: "type",
      label: formatEnumLabel(pasco.type),
      variant: "secondary",
    });
  }

  return badges.slice(0, 2);
}
