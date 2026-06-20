"use client";

import { useQuery } from "@tanstack/react-query";

import { programsListOptions } from "@/lib/api/programs";
import type { ProgramListFilters } from "@/types/api/catalog";

export function usePrograms(filters: ProgramListFilters = {}) {
  return useQuery(programsListOptions(filters));
}
