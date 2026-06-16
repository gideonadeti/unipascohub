import { queryOptions } from "@tanstack/react-query";

import type {
  InstitutionDetailResponse,
  InstitutionListResponse,
} from "@/types/api/catalog";

import { apiFetch } from "./client";
import { queryKeys } from "./query-keys";

export function listInstitutions() {
  return apiFetch<InstitutionListResponse>("/api/institutions");
}

export function getInstitution(id: string) {
  return apiFetch<InstitutionDetailResponse>(`/api/institutions/${id}`);
}

export function institutionsListOptions() {
  return queryOptions({
    queryKey: queryKeys.institutions.list(),
    queryFn: listInstitutions,
  });
}

export function institutionDetailOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.institutions.detail(id),
    queryFn: () => getInstitution(id),
  });
}
