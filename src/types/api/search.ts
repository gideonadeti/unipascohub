import type { ParsedToken } from "@/lib/search/parse-search-query";
import type { CourseSearchResult } from "@/lib/search/search-courses";
import type { PascoListFilters } from "@/types/api/pascos";

export type SearchSuggestCourse = Pick<
  CourseSearchResult,
  "id" | "code" | "title" | "institutionName" | "pascoCount"
>;

export type SearchSuggestResponse = {
  q: string;
  courses: SearchSuggestCourse[];
  detectedFilters: Partial<PascoListFilters>;
  tokens: ParsedToken[];
};
