import { ApiError } from "@/lib/api/client";
import type {
  PascoCreateDuplicateErrorResponse,
  PascoFileDuplicate,
} from "@/types/api/pascos";

export function getPascoFileDuplicatesFromError(
  error: unknown,
): PascoFileDuplicate[] | null {
  if (!(error instanceof ApiError) || error.status !== 409) {
    return null;
  }

  const data = error.data as PascoCreateDuplicateErrorResponse | undefined;

  if (data?.error !== "duplicate_file_content") {
    return null;
  }

  return data.duplicates;
}

export function getPascoCreateErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const data = error.data as { message?: string } | undefined;

    if (typeof data?.message === "string" && data.message.length > 0) {
      return data.message;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Could not add pasco";
}
