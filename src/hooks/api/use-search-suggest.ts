"use client";

import { useQuery } from "@tanstack/react-query";

import { searchSuggestOptions } from "@/lib/api/search";

export function useSearchSuggest(q: string, limit = 8) {
  return useQuery(searchSuggestOptions(q, limit));
}
