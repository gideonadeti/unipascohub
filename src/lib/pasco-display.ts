import { formatEnumLabel } from "@/lib/catalog-labels";
import { filtersToSearchParams } from "@/lib/pasco-list-query";
import type { Course } from "@/types/api/catalog";
import type {
  Pasco,
  PascoCourseSummary,
  PascoListFilters,
  PascoListSearchMeta,
  PascoListSortBy,
} from "@/types/api/pascos";

type PascoTitleFields = Pick<
  Pasco,
  "academicYear" | "educationLevel" | "courseId" | "semesterType" | "type"
>;

type CourseTitleFields = Pick<Course, "code" | "title">;

export function formatCourseLabel(course: CourseTitleFields): string {
  return `${course.code} — ${course.title}`;
}

export function getPascoInstitutionName(
  course?: Pick<PascoCourseSummary, "institutionName"> | null,
): string | undefined {
  const name = course?.institutionName?.trim();

  return name && name.length > 0 ? name : undefined;
}

export function getPascoUploaderLabel(
  pasco: Pick<Pasco, "uploader">,
): string | null {
  const name = pasco.uploader?.name.trim();

  return name && name.length > 0 ? name : null;
}

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
    return formatCourseLabel(course);
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

export { formatRelativeDate as formatPascoRelativeDate } from "@/lib/dates";

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

export function resolveCourseChipLabel(options: {
  filters: PascoListFilters;
  appliedCourse?: PascoCourseSummary | null;
  pascos?: Pick<Pasco, "courseId" | "course">[];
  searchMeta?: PascoListSearchMeta;
}): string | undefined {
  if (options.appliedCourse) {
    return formatCourseLabel(options.appliedCourse);
  }

  if (options.filters.courseId && options.searchMeta?.matchedCourses) {
    const matched = options.searchMeta.matchedCourses.find(
      (course) => course.id === options.filters.courseId,
    );

    if (matched) {
      return formatCourseLabel(matched);
    }
  }

  if (
    !options.filters.courseId &&
    options.searchMeta?.matchedCourseCount === 1
  ) {
    const course = options.searchMeta.matchedCourses[0];

    if (course) {
      return formatCourseLabel(course);
    }
  }

  if (options.filters.courseId && options.pascos) {
    const pasco = options.pascos.find(
      (item) => item.courseId === options.filters.courseId && item.course,
    );

    if (pasco?.course) {
      return formatCourseLabel(pasco.course);
    }
  }

  return undefined;
}
