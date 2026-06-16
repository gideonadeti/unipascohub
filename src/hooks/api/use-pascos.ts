"use client";

import { useQuery } from "@tanstack/react-query";

import { pascosListOptions } from "@/lib/api/pascos";
import type { PascoListFilters } from "@/types/api/pascos";

export function usePascosList(filters: PascoListFilters = {}) {
  return useQuery(pascosListOptions(filters));
}
