import { formatEnumLabel } from "@/lib/catalog-labels";
import { filtersToSearchParams } from "@/lib/pasco-list-query";
import type { Course } from "@/types/api/catalog";
import type { Pasco } from "@/types/api/pascos";

type PascoTitleFields = Pick<
  Pasco,
  "academicYear" | "educationLevel" | "courseId" | "semesterType" | "type"
>;

type CourseTitleFields = Pick<Course, "code" | "title">;

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
    return `${pasco.academicYear} · ${formatEnumLabel(pasco.educationLevel)}`;
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
