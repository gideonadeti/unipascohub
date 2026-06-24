import { queryOptions } from "@tanstack/react-query";

import type {
  CatalogSubmissionCreateRequest,
  CatalogSubmissionCreateResponse,
  CatalogSubmissionListFilters,
  CatalogSubmissionListResponse,
  CatalogSubmissionUpdateRequest,
  CatalogSubmissionUpdateResponse,
  ModerationCatalogSubmissionListFilters,
  ModerationCatalogSubmissionListResponse,
  ModerationCatalogSubmissionUpdateRequest,
  ModerationCatalogSubmissionUpdateResponse,
} from "@/types/api/catalog-submissions";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";

export type { ModerationCatalogSubmissionListFilters } from "@/types/api/catalog-submissions";

export function createCatalogSubmission(
  payload: CatalogSubmissionCreateRequest,
) {
  return apiClient
    .post<CatalogSubmissionCreateResponse>("/api/catalog-submissions", payload)
    .then((response) => response.data);
}

export function listMyCatalogSubmissions(
  filters: CatalogSubmissionListFilters = {},
) {
  return apiClient
    .get<CatalogSubmissionListResponse>("/api/catalog-submissions", {
      params: filters,
    })
    .then((response) => response.data);
}

export function listModerationCatalogSubmissions(
  filters: ModerationCatalogSubmissionListFilters = {},
) {
  return apiClient
    .get<ModerationCatalogSubmissionListResponse>(
      "/api/moderation/catalog-submissions",
      { params: filters },
    )
    .then((response) => response.data);
}

export function resubmitCatalogSubmission(submissionId: string) {
  return apiClient
    .patch<CatalogSubmissionUpdateResponse>(
      `/api/catalog-submissions/${submissionId}`,
    )
    .then((response) => response.data);
}

export function updateCatalogSubmission(
  submissionId: string,
  payload: CatalogSubmissionUpdateRequest,
) {
  return apiClient
    .patch<CatalogSubmissionUpdateResponse>(
      `/api/catalog-submissions/${submissionId}`,
      payload,
    )
    .then((response) => response.data);
}

export function deleteCatalogSubmission(submissionId: string) {
  return apiClient
    .delete(`/api/catalog-submissions/${submissionId}`)
    .then((response) => response.data);
}

export function moderateCatalogSubmissionReview(
  submissionId: string,
  payload: ModerationCatalogSubmissionUpdateRequest,
) {
  return apiClient
    .patch<ModerationCatalogSubmissionUpdateResponse>(
      `/api/moderation/catalog-submissions/${submissionId}`,
      payload,
    )
    .then((response) => response.data);
}

export function myCatalogSubmissionsOptions(
  filters: CatalogSubmissionListFilters = {},
) {
  return queryOptions({
    queryKey: queryKeys.catalogSubmissions.mine(filters),
    queryFn: () => listMyCatalogSubmissions(filters),
  });
}

export function moderationCatalogSubmissionsListOptions(
  filters: ModerationCatalogSubmissionListFilters = {},
) {
  return queryOptions({
    queryKey: queryKeys.moderation.catalog(filters),
    queryFn: () => listModerationCatalogSubmissions(filters),
  });
}
