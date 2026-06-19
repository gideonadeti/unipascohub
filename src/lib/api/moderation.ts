import { queryOptions } from "@tanstack/react-query";

import type {
  ModerationPascoAction,
  ModerationPascoListResponse,
  ModerationPascoUpdateResponse,
} from "@/types/api/pascos";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";

export type ModerationPascoListFilters = {
  status?: "PUBLISHED" | "PENDING_REVIEW" | "REJECTED";
  page?: number;
  limit?: number;
};

export function listModerationPascos(filters: ModerationPascoListFilters = {}) {
  return apiClient
    .get<ModerationPascoListResponse>("/api/moderation/pascos", {
      params: filters,
    })
    .then((response) => response.data);
}

export function moderatePascoReview(
  pascoId: string,
  action: ModerationPascoAction,
) {
  return apiClient
    .patch<ModerationPascoUpdateResponse>(`/api/moderation/pascos/${pascoId}`, {
      action,
    })
    .then((response) => response.data);
}

export function moderationPascosListOptions(
  filters: ModerationPascoListFilters = {},
) {
  return queryOptions({
    queryKey: queryKeys.moderation.pascos(filters),
    queryFn: () => listModerationPascos(filters),
  });
}
