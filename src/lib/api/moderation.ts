import { queryOptions } from "@tanstack/react-query";

import type {
  ModerationPascoListResponse,
  ModerationPascoUpdateRequest,
  ModerationPascoUpdateResponse,
  ModerationSettingsResponse,
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
  payload: ModerationPascoUpdateRequest,
) {
  return apiClient
    .patch<ModerationPascoUpdateResponse>(
      `/api/moderation/pascos/${pascoId}`,
      payload,
    )
    .then((response) => response.data);
}

export function getModerationSettings() {
  return apiClient
    .get<ModerationSettingsResponse>("/api/admin/settings/moderation")
    .then((response) => response.data);
}

export function updateModerationSettings(dislikeThreshold: number) {
  return apiClient
    .patch<ModerationSettingsResponse>("/api/admin/settings/moderation", {
      dislikeThreshold,
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

export function moderationSettingsOptions() {
  return queryOptions({
    queryKey: queryKeys.moderation.settings(),
    queryFn: getModerationSettings,
  });
}
