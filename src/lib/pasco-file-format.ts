import type { PascoFile } from "@/types/api/pascos";

export function formatPascoFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1_048_576) {
    return `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;
  }

  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export function formatPascoFileDisplayName(
  file: Pick<PascoFile, "order" | "fileName">,
): string {
  return `${file.order}. ${file.fileName}`;
}
