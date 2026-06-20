import { PassThrough, Readable } from "node:stream";
import { ZipArchive } from "archiver";

import { formatEnumLabel } from "@/lib/catalog-labels";
import { createSignedCloudinaryDownloadUrl } from "@/lib/cloudinary";
import { prisma } from "@/lib/db";
import { formatPascoFileDisplayName } from "@/lib/pasco-file-format";
import {
  canViewPasco,
  type PascoViewerContext,
} from "@/lib/pasco-moderation-utils";
import type { Course } from "@/types/api/catalog";
import type {
  CloudinaryResourceType,
  Pasco,
  PascoFile,
} from "@/types/api/pascos";

export type PascoDownloadAllFile = Pick<
  PascoFile,
  "id" | "order" | "fileName" | "resourceType"
> & {
  publicId: string;
};

export type RecordPascoDownloadAllError =
  | "pasco_not_found"
  | "user_not_found"
  | "insufficient_files";

export type CreatePascoDownloadAllZipStreamError =
  | "asset_not_found"
  | "missing_config"
  | "signed_url_failed"
  | "download_failed";

function sanitizeZipFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildPascoZipEntryName(
  file: Pick<PascoFile, "order" | "fileName">,
): string {
  return formatPascoFileDisplayName(file);
}

export function buildPascoZipFilename(
  pasco: Pick<Pasco, "academicYear" | "type">,
  course?: Pick<Course, "code"> | null,
): string {
  const parts = [
    course?.code,
    pasco.academicYear.replace("/", "-"),
    formatEnumLabel(pasco.type).toLowerCase().replace(/\s+/g, "-"),
  ]
    .filter((part): part is string => Boolean(part?.trim()))
    .map((part) => sanitizeZipFilenamePart(part));

  const base = parts.length > 0 ? parts.join("-") : "pasco-files";

  return `${base}.zip`;
}

export async function recordPascoDownloadAll(
  userId: string,
  pascoId: string,
  viewer?: PascoViewerContext | null,
): Promise<
  | {
      success: true;
      files: PascoDownloadAllFile[];
      downloadCount: number;
      pasco: Pick<Pasco, "academicYear" | "type">;
    }
  | { success: false; error: RecordPascoDownloadAllError }
> {
  const [pasco, user] = await Promise.all([
    prisma.pasco.findUnique({
      where: { id: pascoId },
      select: {
        id: true,
        uploaderId: true,
        moderationStatus: true,
        academicYear: true,
        type: true,
        files: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            order: true,
            publicId: true,
            fileName: true,
            resourceType: true,
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    }),
  ]);

  if (!pasco || !canViewPasco(viewer ?? { userId, role: null }, pasco)) {
    return { success: false, error: "pasco_not_found" };
  }

  if (!user) {
    return { success: false, error: "user_not_found" };
  }

  if (pasco.files.length < 2) {
    return { success: false, error: "insufficient_files" };
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.pascoDownload.createMany({
      data: pasco.files.map((file) => ({
        userId,
        pascoId,
        fileId: file.id,
      })),
    });

    return tx.pasco.update({
      where: { id: pascoId },
      data: {
        downloadCount: { increment: pasco.files.length },
      },
      select: {
        downloadCount: true,
      },
    });
  });

  return {
    success: true,
    files: pasco.files,
    downloadCount: updated.downloadCount,
    pasco: {
      academicYear: pasco.academicYear,
      type: pasco.type,
    },
  };
}

export async function createPascoDownloadAllZipStream(
  files: PascoDownloadAllFile[],
): Promise<
  | { success: true; stream: PassThrough }
  | { success: false; error: CreatePascoDownloadAllZipStreamError }
> {
  const signedEntries: Array<{ entryName: string; url: string }> = [];

  for (const file of files) {
    const signedUrlResult = await createSignedCloudinaryDownloadUrl({
      publicId: file.publicId,
      fileName: file.fileName,
      resourceType: file.resourceType as CloudinaryResourceType,
    });

    if (!signedUrlResult.success) {
      return { success: false, error: signedUrlResult.error };
    }

    signedEntries.push({
      entryName: buildPascoZipEntryName(file),
      url: signedUrlResult.url,
    });
  }

  const passthrough = new PassThrough();
  const archive = new ZipArchive({ zlib: { level: 5 } });

  archive.on("error", (error: Error) => {
    passthrough.destroy(error);
  });

  archive.pipe(passthrough);

  void (async () => {
    try {
      for (const entry of signedEntries) {
        const response = await fetch(entry.url);

        if (!response.ok || response.body === null) {
          throw new Error("download_failed");
        }

        archive.append(
          Readable.fromWeb(
            response.body as Parameters<typeof Readable.fromWeb>[0],
          ),
          { name: entry.entryName },
        );
      }

      await archive.finalize();
    } catch (error) {
      archive.abort();
      passthrough.destroy(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  })();

  return { success: true, stream: passthrough };
}
