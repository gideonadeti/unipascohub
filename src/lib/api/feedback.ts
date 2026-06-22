import { queryOptions } from "@tanstack/react-query";

import type {
  CreateFeedbackRequest,
  CreateFeedbackResponse,
  ListFeedbackRequest,
  ListFeedbackResponse,
  UpdateFeedbackStatusRequest,
  UpdateFeedbackStatusResponse,
} from "@/types/api/feedback";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";

export function createFeedback(payload: CreateFeedbackRequest) {
  return apiClient
    .post<CreateFeedbackResponse>("/api/feedback", payload)
    .then((response) => response.data);
}

export function listModerationFeedback(filters: ListFeedbackRequest = {}) {
  return apiClient
    .get<ListFeedbackResponse>("/api/feedback", { params: filters })
    .then((response) => response.data);
}

export function updateFeedbackStatus(
  feedbackId: string,
  payload: UpdateFeedbackStatusRequest,
) {
  return apiClient
    .patch<UpdateFeedbackStatusResponse>(`/api/feedback/${feedbackId}`, payload)
    .then((response) => response.data);
}

export function moderationFeedbackListOptions(
  filters: ListFeedbackRequest = {},
) {
  return queryOptions({
    queryKey: queryKeys.feedback.list(filters),
    queryFn: () => listModerationFeedback(filters),
  });
}
