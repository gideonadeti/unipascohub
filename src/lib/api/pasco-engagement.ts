import type { QueryClient } from "@tanstack/react-query";

import type {
  PascoDetailResponse,
  PascoDownloadResponse,
  PascoFileViewResponse,
  PascoReactionResponse,
  PascoReactionType,
  PascoViewResponse,
} from "@/types/api/pascos";

import { ApiError, apiClient } from "./client";
import { queryKeys } from "./query-keys";

export type PascoDownloadAllResult = {
  blob: Blob;
  downloadCount: number;
  fileName: string;
};

function parseFilenameFromContentDisposition(
  header: string | null,
): string | null {
  if (!header) {
    return null;
  }

  const quotedMatch = /filename="([^"]+)"/i.exec(header);

  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const unquotedMatch = /filename=([^;]+)/i.exec(header);

  return unquotedMatch?.[1]?.trim() ?? null;
}

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

export async function downloadPascoAll(
  pascoId: string,
): Promise<PascoDownloadAllResult> {
  const response = await fetch(`/api/pascos/${pascoId}/download-all`, {
    method: "POST",
  });

  const contentType = response.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/zip")) {
    const blob = await response.blob();
    const downloadCountHeader = response.headers.get("X-Pasco-Download-Count");
    const parsedDownloadCount = downloadCountHeader
      ? Number.parseInt(downloadCountHeader, 10)
      : Number.NaN;
    const downloadCount = Number.isFinite(parsedDownloadCount)
      ? parsedDownloadCount
      : 0;
    const fileName =
      parseFilenameFromContentDisposition(
        response.headers.get("Content-Disposition"),
      ) ?? "pasco-files.zip";

    return { blob, downloadCount, fileName };
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    data = undefined;
  }

  const message =
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
      ? data.error
      : response.statusText;

  throw new ApiError(message, response.status, data);
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
