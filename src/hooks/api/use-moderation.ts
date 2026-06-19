"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  listModerationPascos,
  type ModerationPascoListFilters,
  moderatePascoReview,
  moderationPascosListOptions,
  moderationSettingsOptions,
  updateModerationSettings,
} from "@/lib/api/moderation";
import { queryKeys } from "@/lib/api/query-keys";
import type { ModerationPascoUpdateRequest } from "@/types/api/pascos";

export function useModerationPascosList(
  filters: ModerationPascoListFilters = { status: "PENDING_REVIEW" },
) {
  return useQuery(moderationPascosListOptions(filters));
}

export function useModerationSettings() {
  return useQuery(moderationSettingsOptions());
}

export function useUpdateModerationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dislikeThreshold: number) =>
      updateModerationSettings(dislikeThreshold),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.moderation.settings(),
      });
      toast.success("Moderation threshold updated");
    },
    onError: () => {
      toast.error("Could not update moderation threshold");
    },
  });
}

export function useModeratePascoReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pascoId,
      ...payload
    }: ModerationPascoUpdateRequest & { pascoId: string }) =>
      moderatePascoReview(pascoId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pascos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pascos.detail(variables.pascoId),
      });

      const messages: Record<ModerationPascoUpdateRequest["action"], string> = {
        approve: "Pasco approved and published",
        reject: "Pasco rejected",
        restore: "Pasco restored and published",
        flag: "Pasco sent to review",
      };

      toast.success(messages[variables.action]);
    },
    onError: () => {
      toast.error("Could not update moderation status");
    },
  });
}

export { listModerationPascos };
