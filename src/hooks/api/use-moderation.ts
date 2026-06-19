"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  listModerationPascos,
  type ModerationPascoListFilters,
  moderatePascoReview,
  moderationPascosListOptions,
} from "@/lib/api/moderation";
import { queryKeys } from "@/lib/api/query-keys";
import type { ModerationPascoAction } from "@/types/api/pascos";

export function useModerationPascosList(
  filters: ModerationPascoListFilters = { status: "PENDING_REVIEW" },
) {
  return useQuery(moderationPascosListOptions(filters));
}

export function useModeratePascoReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pascoId,
      action,
    }: {
      pascoId: string;
      action: ModerationPascoAction;
    }) => moderatePascoReview(pascoId, action),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pascos.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pascos.detail(variables.pascoId),
      });

      toast.success(
        variables.action === "approve"
          ? "Pasco approved and published"
          : "Pasco rejected",
      );
    },
    onError: () => {
      toast.error("Could not update moderation status");
    },
  });
}

export { listModerationPascos };
