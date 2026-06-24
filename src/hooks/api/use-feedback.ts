"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createFeedback as createFeedbackApi,
  moderationFeedbackListOptions,
  updateFeedbackStatus as updateFeedbackStatusApi,
} from "@/lib/api/feedback";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  CreateFeedbackRequest,
  ListFeedbackRequest,
  UpdateFeedbackStatusRequest,
} from "@/types/api/feedback";

export function useCreateFeedback() {
  return useMutation({
    mutationFn: (payload: CreateFeedbackRequest) => createFeedbackApi(payload),
    onSuccess: () => {
      toast.success("Feedback submitted. Thank you!");
    },
    onError: () => {
      toast.error("Could not submit feedback. Please try again.");
    },
  });
}

export function useModerationFeedbackList(filters: ListFeedbackRequest = {}) {
  return useQuery(moderationFeedbackListOptions(filters));
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      feedbackId,
      ...payload
    }: UpdateFeedbackStatusRequest & { feedbackId: string }) =>
      updateFeedbackStatusApi(feedbackId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.all });
      toast.success("Feedback status updated");
    },
    onError: () => {
      toast.error("Could not update feedback status");
    },
  });
}
