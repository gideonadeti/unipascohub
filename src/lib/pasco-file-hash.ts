import "server-only";

import { isValidContentHash, normalizeContentHash } from "@/lib/content-hash";
import { prisma } from "@/lib/db";
import type { PascoFileDuplicate } from "@/types/api/pascos";

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
