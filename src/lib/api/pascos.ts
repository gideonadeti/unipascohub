import { queryOptions } from "@tanstack/react-query";

import type {
  PascoCreateInput,
  PascoCreateResponse,
  PascoDetailResponse,
  PascoFileComputeHashInput,
  PascoFileComputeHashResponse,
  PascoFileDuplicateCheckResponse,
  PascoListFilters,
  PascoListResponse,
} from "@/types/api/pascos";

import { apiClient, apiFetch } from "./client";
import { queryKeys } from "./query-keys";

export function listPascos(filters: PascoListFilters = {}) {
  return apiClient
    .get<PascoListResponse>("/api/pascos", { params: filters })
    .then((response) => response.data);
}

export function getPasco(id: string) {
  return apiFetch<PascoDetailResponse>(`/api/pascos/${id}`);
}

export function createPasco(input: PascoCreateInput) {
  return apiClient
    .post<PascoCreateResponse>("/api/pascos", input)
    .then((response) => response.data);
}

export function checkPascoFileDuplicates(
  courseId: string,
  contentHashes: string[],
) {
  return apiClient
    .post<PascoFileDuplicateCheckResponse>(
      "/api/pascos/files/check-duplicates",
      {
        courseId,
        contentHashes,
      },
    )
    .then((response) => response.data);
}

export function computePascoFileHash(input: PascoFileComputeHashInput) {
  return apiClient
    .post<PascoFileComputeHashResponse>("/api/pascos/files/compute-hash", input)
    .then((response) => response.data);
}

export function pascosListOptions(filters: PascoListFilters = {}) {
  return queryOptions({
    queryKey: queryKeys.pascos.list(filters),
    queryFn: () => listPascos(filters),
  });
}

export function pascoDetailOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.pascos.detail(id),
    queryFn: () => getPasco(id),
  });
}
