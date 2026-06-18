import type { PascoListFilters } from "@/types/api/pascos";

import { mergePascoListFilters } from "./merge-filters";
import { parseSearchQuery } from "./parse-search-query";
import {
  type CourseSearchResult,
  isExactCourseMatch,
  searchCourses,
} from "./search-courses";

export type SearchResolution = {
  parsedFilters: Partial<PascoListFilters>;
  courseQuery?: string;
  matchedCourseIds: string[];
  matchedCourses: CourseSearchResult[];
  ambiguous: boolean;
  noCourseMatch: boolean;
};

export type ResolvedPascoListSearch = {
  filters: PascoListFilters & { courseIds?: string[] };
  resolution: SearchResolution;
};

function mergeExplicitFilters(
  parsed: Partial<PascoListFilters>,
  explicit: PascoListFilters,
): PascoListFilters {
  const merged = mergePascoListFilters(parsed, explicit);

  return {
    ...merged,
    page: explicit.page ?? parsed.page ?? 1,
    limit: explicit.limit ?? parsed.limit,
    sortBy: explicit.sortBy ?? parsed.sortBy,
    sortOrder: explicit.sortOrder ?? parsed.sortOrder,
  };
}

export async function resolvePascoListFromSearch(
  q: string | undefined,
  explicit: PascoListFilters,
): Promise<ResolvedPascoListSearch> {
  const trimmedQ = q?.trim();

  if (!trimmedQ) {
    return {
      filters: explicit,
      resolution: {
        parsedFilters: {},
        matchedCourseIds: [],
        matchedCourses: [],
        ambiguous: false,
        noCourseMatch: false,
      },
    };
  }

  const parsed = parseSearchQuery(trimmedQ);
  const merged = mergeExplicitFilters(parsed.filters, {
    ...explicit,
    q: trimmedQ,
  });

  if (explicit.courseId) {
    return {
      filters: merged,
      resolution: {
        parsedFilters: parsed.filters,
        courseQuery: parsed.courseQuery,
        matchedCourseIds: [explicit.courseId],
        matchedCourses: [],
        ambiguous: false,
        noCourseMatch: false,
      },
    };
  }

  if (!parsed.courseQuery) {
    return {
      filters: merged,
      resolution: {
        parsedFilters: parsed.filters,
        matchedCourseIds: [],
        matchedCourses: [],
        ambiguous: false,
        noCourseMatch: false,
      },
    };
  }

  const matchedCourses = await searchCourses(parsed.courseQuery, 8);
  const matchedCourseIds = matchedCourses.map((course) => course.id);
  const exactMatch = isExactCourseMatch(matchedCourses, parsed.courseQuery);

  if (matchedCourses.length === 0) {
    return {
      filters: {
        ...merged,
        courseIds: [],
      },
      resolution: {
        parsedFilters: parsed.filters,
        courseQuery: parsed.courseQuery,
        matchedCourseIds: [],
        matchedCourses: [],
        ambiguous: false,
        noCourseMatch: true,
      },
    };
  }

  if (matchedCourses.length === 1 || exactMatch) {
    const courseId = exactMatch
      ? (matchedCourses.find((course) => course.matchKind === "exact")?.id ??
        matchedCourses[0]?.id)
      : matchedCourses[0]?.id;

    if (!courseId) {
      return {
        filters: merged,
        resolution: {
          parsedFilters: parsed.filters,
          courseQuery: parsed.courseQuery,
          matchedCourseIds: [],
          matchedCourses,
          ambiguous: false,
          noCourseMatch: true,
        },
      };
    }

    return {
      filters: {
        ...merged,
        courseId,
      },
      resolution: {
        parsedFilters: parsed.filters,
        courseQuery: parsed.courseQuery,
        matchedCourseIds: [courseId],
        matchedCourses,
        ambiguous: false,
        noCourseMatch: false,
      },
    };
  }

  return {
    filters: {
      ...merged,
      courseIds: matchedCourseIds,
    },
    resolution: {
      parsedFilters: parsed.filters,
      courseQuery: parsed.courseQuery,
      matchedCourseIds,
      matchedCourses,
      ambiguous: true,
      noCourseMatch: false,
    },
  };
}
