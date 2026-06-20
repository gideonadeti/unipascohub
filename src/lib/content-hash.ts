import type { PascoFileDuplicate } from "@/types/api/pascos";

export const CONTENT_HASH_REGEX = /^[a-f0-9]{64}$/;

export function isValidContentHash(value: string): boolean {
  return CONTENT_HASH_REGEX.test(value);
}

export function normalizeContentHash(value: string): string {
  return value.trim().toLowerCase();
}

export function formatDuplicateFileMessage(
  duplicate: PascoFileDuplicate,
): string {
  return `This exact file already exists (${duplicate.fileName}).`;
}

export function formatDuplicateFilesMessage(
  duplicates: PascoFileDuplicate[],
): string {
  if (duplicates.length === 0) {
    return "This exact file already exists.";
  }

  if (duplicates.length === 1) {
    return formatDuplicateFileMessage(duplicates[0]);
  }

  return `${duplicates.length} of these files already exist.`;
}
