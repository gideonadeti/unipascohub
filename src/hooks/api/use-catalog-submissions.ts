"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createCatalogSubmission,
  listMyCatalogSubmissions,
  type ModerationCatalogSubmissionListFilters,
  moderateCatalogSubmissionReview,
  moderationCatalogSubmissionsListOptions,
  myCatalogSubmissionsOptions,
} from "@/lib/api/catalog-submissions";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  CatalogSubmissionCreateRequest,
  CatalogSubmissionListFilters,
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

export { listMyCatalogSubmissions };
