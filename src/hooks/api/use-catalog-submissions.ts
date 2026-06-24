"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createCatalogSubmission,
  deleteCatalogSubmission as deleteCatalogSubmissionApi,
  listMyCatalogSubmissions,
  type ModerationCatalogSubmissionListFilters,
  moderateCatalogSubmissionReview,
  moderationCatalogSubmissionsListOptions,
  myCatalogSubmissionsOptions,
  resubmitCatalogSubmission as resubmitCatalogSubmissionApi,
  updateCatalogSubmission as updateCatalogSubmissionApi,
} from "@/lib/api/catalog-submissions";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  CatalogSubmissionCreateRequest,
  CatalogSubmissionListFilters,
  CatalogSubmissionUpdateRequest,
  ModerationCatalogSubmissionUpdateRequest,
} from "@/types/api/catalog-submissions";

export function useMyCatalogSubmissions(
  filters: CatalogSubmissionListFilters = {},
) {
  return useQuery(myCatalogSubmissionsOptions(filters));
}

export function useModerationCatalogSubmissionsList(
  filters: ModerationCatalogSubmissionListFilters = { status: "PENDING" },
) {
  return useQuery(moderationCatalogSubmissionsListOptions(filters));
}

export function useCreateCatalogSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CatalogSubmissionCreateRequest) =>
      createCatalogSubmission(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.catalogSubmissions.all,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      const { submission } = data;

      if (submission.type === "COURSE" && submission.status === "APPROVED") {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.programs.all });
        toast.success("Course added to catalog");
        return;
      }

      toast.success("Submitted for catalog review");
    },
    onError: () => {
      toast.error("Could not submit catalog request");
    },
  });
}

export function useModerateCatalogSubmissionReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      ...payload
    }: ModerationCatalogSubmissionUpdateRequest & { submissionId: string }) =>
      moderateCatalogSubmissionReview(submissionId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.catalogSubmissions.all,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.institutions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.programs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      const messages: Record<
        ModerationCatalogSubmissionUpdateRequest["action"],
        string
      > = {
        approve: "Catalog submission approved",
        reject: "Catalog submission rejected",
      };

      toast.success(messages[variables.action]);
    },
    onError: () => {
      toast.error("Could not update catalog submission");
    },
  });
}

export function useResubmitCatalogSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: string) =>
      resubmitCatalogSubmissionApi(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.catalogSubmissions.all,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      toast.success("Submission resubmitted for review");
    },
    onError: () => {
      toast.error("Could not resubmit catalog request");
    },
  });
}

export function useUpdateCatalogSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      ...payload
    }: CatalogSubmissionUpdateRequest & { submissionId: string }) =>
      updateCatalogSubmissionApi(submissionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.catalogSubmissions.all,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      toast.success("Changes saved. Submission resubmitted for review.");
    },
    onError: () => {
      toast.error("Could not update catalog request");
    },
  });
}

export function useDeleteCatalogSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: string) =>
      deleteCatalogSubmissionApi(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.catalogSubmissions.all,
      });
      toast.success("Catalog request deleted");
    },
    onError: () => {
      toast.error("Could not delete catalog request");
    },
  });
}

export { listMyCatalogSubmissions };
