import { filtersToSearchParams } from "@/lib/pasco-list-query";
import type { PascoListFilters } from "@/types/api/pascos";

export function buildBrowseHref(
  filters: Partial<PascoListFilters> & { courseId?: string },
  options?: { defaultLimit?: number },
): string {
  const params = filtersToSearchParams(
    {
      courseId: filters.courseId,
      educationLevel: filters.educationLevel,
      academicYear: filters.academicYear,
      semesterType: filters.semesterType,
      type: filters.type,
      contentType: filters.contentType,
      isComplete: filters.isComplete,
      page: 1,
    },
    options,
  );

  const query = params.toString();
  return query ? `/pascos?${query}` : "/pascos";
}

export function buildBrowseHrefFromQuery(rawQuery: string): string {
  const trimmed = rawQuery.trim();

  if (!trimmed) {
    return "/pascos";
  }

  return `/pascos?q=${encodeURIComponent(trimmed)}`;
}
