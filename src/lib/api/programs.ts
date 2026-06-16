import { queryOptions } from "@tanstack/react-query";

import type {
  ProgramDetailResponse,
  ProgramListFilters,
  ProgramListResponse,
} from "@/types/api/catalog";

import { apiClient, apiFetch } from "./client";
import { queryKeys } from "./query-keys";

export function listPrograms(filters: ProgramListFilters = {}) {
  return apiClient
    .get<ProgramListResponse>("/api/programs", { params: filters })
    .then((response) => response.data);
}

export function getProgram(id: string) {
  return apiFetch<ProgramDetailResponse>(`/api/programs/${id}`);
}

export function programsListOptions(filters: ProgramListFilters = {}) {
  return queryOptions({
    queryKey: queryKeys.programs.list(filters),
    queryFn: () => listPrograms(filters),
  });
}

export function programDetailOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.programs.detail(id),
    queryFn: () => getProgram(id),
  });
}
