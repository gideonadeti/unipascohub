import { prisma } from "@/lib/db";

export const CONTENT_HASH_REGEX = /^[a-f0-9]{64}$/;

export type PascoFileDuplicate = {
  contentHash: string;
  fileName: string;
  pascoId: string;
};

export function isValidContentHash(value: string): boolean {
  return CONTENT_HASH_REGEX.test(value);
}

export function normalizeContentHash(value: string): string {
  return value.trim().toLowerCase();
}

export async function findDuplicatePascoFiles(
  contentHashes: string[],
): Promise<PascoFileDuplicate[]> {
  const normalizedHashes = [
    ...new Set(
      contentHashes.map(normalizeContentHash).filter(isValidContentHash),
    ),
  ];

  if (normalizedHashes.length === 0) {
    return [];
  }

  const matches = await prisma.pascoFile.findMany({
    where: {
      contentHash: { in: normalizedHashes },
    },
    select: {
      contentHash: true,
      fileName: true,
      pascoId: true,
    },
  });

  return matches.flatMap((file) => {
    if (!file.contentHash) {
      return [];
    }

    return [
      {
        contentHash: file.contentHash,
        fileName: file.fileName,
        pascoId: file.pascoId,
      },
    ];
  });
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
