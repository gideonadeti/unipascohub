"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import {
  downloadPascoAll,
  getPascoFileViewUrl,
  patchPascoDetailEngagement,
  recordPascoFileDownload,
  recordPascoView,
  setPascoReaction,
} from "@/lib/api/pasco-engagement";
import { queryKeys } from "@/lib/api/query-keys";
import { getPascoEngagementErrorMessage } from "@/lib/pasco-engagement-error";
import type { PascoReactionType } from "@/types/api/pascos";

export function useSetPascoReaction(pascoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reactionType: PascoReactionType | null) =>
      setPascoReaction(pascoId, reactionType),
    onSuccess: (data) => {
      patchPascoDetailEngagement(queryClient, pascoId, {
        likeCount: data.likeCount,
        dislikeCount: data.dislikeCount,
        viewerReaction: data.viewerReaction,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.pascos.all });
    },
    onError: (error) => {
      toast.error(getPascoEngagementErrorMessage(error, "reaction"));
    },
  });
}

export function useRecordPascoView(pascoId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const recordedRef = useRef(false);

  const mutation = useMutation({
    mutationFn: () => recordPascoView(pascoId),
    onSuccess: (data) => {
      patchPascoDetailEngagement(queryClient, pascoId, {
        viewCount: data.viewCount,
      });
    },
  });

  const { mutate } = mutation;

  useEffect(() => {
    if (!enabled || pascoId.length === 0 || recordedRef.current) {
      return;
    }

    recordedRef.current = true;
    mutate();
  }, [enabled, pascoId, mutate]);

  return mutation;
}

export function useRecordPascoFileDownload(pascoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => recordPascoFileDownload(pascoId, fileId),
    onSuccess: (data) => {
      patchPascoDetailEngagement(queryClient, pascoId, {
        downloadCount: data.downloadCount,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.pascos.all });
    },
    onError: (error) => {
      toast.error(getPascoEngagementErrorMessage(error, "download"));
    },
  });
}

export function useDownloadPascoAll(pascoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => downloadPascoAll(pascoId),
    onSuccess: (data) => {
      patchPascoDetailEngagement(queryClient, pascoId, {
        downloadCount: data.downloadCount,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.pascos.all });
    },
    onError: (error) => {
      toast.error(getPascoEngagementErrorMessage(error, "download"));
    },
  });
}

export function usePascoFileViewUrl(pascoId: string) {
  return useMutation({
    mutationFn: (fileId: string) => getPascoFileViewUrl(pascoId, fileId),
    onError: (error) => {
      toast.error(getPascoEngagementErrorMessage(error, "fileView"));
    },
  });
}
