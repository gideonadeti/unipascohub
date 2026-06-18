import { queryOptions } from "@tanstack/react-query";

import type { SearchSuggestResponse } from "@/types/api/search";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";

export function searchSuggest(q: string, limit = 8) {
  return apiClient
    .get<SearchSuggestResponse>("/api/search/suggest", {
      params: { q, limit },
    })
    .then((response) => response.data);
}

export function searchSuggestOptions(q: string, limit = 8) {
  const trimmed = q.trim();

  return queryOptions({
    queryKey: queryKeys.search.suggest(trimmed, limit),
    queryFn: () => searchSuggest(trimmed, limit),
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
  });
}
