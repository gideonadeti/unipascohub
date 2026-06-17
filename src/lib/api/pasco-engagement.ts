import type { QueryClient } from "@tanstack/react-query";

import type {
  PascoDetailResponse,
  PascoDownloadResponse,
  PascoFileViewResponse,
  PascoReactionResponse,
  PascoReactionType,
  PascoViewResponse,
} from "@/types/api/pascos";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";

export function setPascoReaction(
  pascoId: string,
  reactionType: PascoReactionType | null,
) {
  return apiClient
    .put<PascoReactionResponse>(`/api/pascos/${pascoId}/reaction`, {
      reactionType,
    })
    .then((response) => response.data);
}

export function recordPascoView(pascoId: string) {
  return apiClient
    .post<PascoViewResponse>(`/api/pascos/${pascoId}/view`)
    .then((response) => response.data);
}

export function recordPascoFileDownload(pascoId: string, fileId: string) {
  return apiClient
    .post<PascoDownloadResponse>(
      `/api/pascos/${pascoId}/files/${fileId}/download`,
    )
    .then((response) => response.data);
}

export function getPascoFileViewUrl(pascoId: string, fileId: string) {
  return apiClient
    .post<PascoFileViewResponse>(`/api/pascos/${pascoId}/files/${fileId}/view`)
    .then((response) => response.data);
}

export function patchPascoDetailEngagement(
  queryClient: QueryClient,
  pascoId: string,
  patch: Partial<{
    likeCount: number;
    dislikeCount: number;
    downloadCount: number;
    viewCount: number;
    viewerReaction: PascoReactionType | null;
  }>,
) {
  queryClient.setQueryData<PascoDetailResponse>(
    queryKeys.pascos.detail(pascoId),
    (current) => {
      if (!current) {
        return current;
      }

      return {
        pasco: {
          ...current.pasco,
          ...patch,
        },
      };
    },
  );
}
