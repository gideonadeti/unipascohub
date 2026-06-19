"use client";

import { useCallback, useEffect, useState } from "react";

import {
  addRecentSearch,
  getRecentSearches,
  removeRecentSearch,
} from "@/lib/search/recent-searches";

export function useRecentSearches() {
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    setRecents(getRecentSearches());
  }, []);

  const push = useCallback((query: string) => {
    addRecentSearch(query);
    setRecents(getRecentSearches());
  }, []);

  const remove = useCallback((query: string) => {
    removeRecentSearch(query);
    setRecents(getRecentSearches());
  }, []);

  return { recents, push, remove };
}
