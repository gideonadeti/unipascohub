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

export function getPascoMutationErrorMessage(
  error: unknown,
  action: "create" | "update",
): string {
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

  return action === "create" ? "Could not add pasco" : "Could not update pasco";
}

/** @deprecated Use getPascoMutationErrorMessage(error, "create") */
export function getPascoCreateErrorMessage(error: unknown): string {
  return getPascoMutationErrorMessage(error, "create");
}

export function getPascoUpdateErrorMessage(error: unknown): string {
  return getPascoMutationErrorMessage(error, "update");
}
