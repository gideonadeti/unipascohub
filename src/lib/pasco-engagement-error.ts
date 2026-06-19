import { ApiError } from "@/lib/api/client";

export function getPascoEngagementErrorMessage(
  error: unknown,
  action: "reaction" | "view" | "download" | "fileView",
): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Sign in to continue";
    }

    if (error.status === 404) {
      const data = error.data as { error?: string } | undefined;

      if (data?.error === "User not found") {
        return "Your account is still syncing. Please try again in a moment.";
      }

      if (data?.error === "File not found") {
        return "File not found";
      }

      return action === "download" || action === "fileView"
        ? "Pasco or file not found"
        : "Pasco not found";
    }

    if (error.status === 400 && action === "download") {
      const data = error.data as { error?: string } | undefined;

      if (data?.error === "At least two files are required for bulk download") {
        return "Nothing to download as a bundle";
      }
    }

    if (error.status === 429) {
      return "Too many requests. Please wait a moment and try again.";
    }

    if (
      error.status === 500 &&
      (action === "download" || action === "fileView")
    ) {
      const data = error.data as { error?: string } | undefined;

      if (data?.error === "Cloudinary is not configured") {
        return action === "download"
          ? "Downloads are temporarily unavailable. Please try again later."
          : "Viewing is temporarily unavailable. Please try again later.";
      }
    }

    if (error.status === 502 && action === "download") {
      return "Could not prepare download. Please try again.";
    }

    if (error.status === 502 && action === "fileView") {
      return "Could not prepare view. Please try again.";
    }

    const data = error.data as { error?: string; message?: string } | undefined;

    if (typeof data?.message === "string" && data.message.length > 0) {
      return data.message;
    }

    if (typeof data?.error === "string" && data.error.length > 0) {
      return data.error;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (action === "reaction") {
    return "Could not update reaction";
  }

  if (action === "download") {
    return "Could not download file";
  }

  if (action === "fileView") {
    return "Could not open file";
  }

  return "Could not record view";
}
