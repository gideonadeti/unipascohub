import { prisma } from "@/lib/db";
import type {
  CloudinaryResourceType as CloudinaryResourceTypeType,
  StorageCleanupSource,
} from "../../generated/prisma/enums";

type StorageCleanupFailureFile = {
  publicId: string;
  resourceType: CloudinaryResourceTypeType;
};

type RecordStorageCleanupFailuresInput = {
  files: StorageCleanupFailureFile[];
  source: StorageCleanupSource;
  pascoId?: string;
  triggeredById?: string;
};

export type OrphanCleanupRunDetails = {
  orphans: string[];
  deleted: string[];
  deleteFailures: string[];
};

export async function recordStorageCleanupFailures(
  input: RecordStorageCleanupFailuresInput,
): Promise<void> {
  if (input.files.length === 0) {
    return;
  }

  try {
    await Promise.all(
      input.files.map((file) =>
        prisma.storageCleanupFailure.upsert({
          where: { publicId: file.publicId },
          create: {
            publicId: file.publicId,
            resourceType: file.resourceType,
            source: input.source,
            pascoId: input.pascoId,
            triggeredById: input.triggeredById,
          },
          update: {
            resourceType: file.resourceType,
            source: input.source,
            pascoId: input.pascoId,
            triggeredById: input.triggeredById,
            resolvedAt: null,
          },
        }),
      ),
    );
  } catch (error) {
    console.error("Failed to record storage cleanup failures:", error);
  }
}

export async function resolveStorageCleanupFailures(
  publicIds: string[],
): Promise<void> {
  if (publicIds.length === 0) {
    return;
  }

  try {
    await prisma.storageCleanupFailure.updateMany({
      where: {
        publicId: { in: publicIds },
        resolvedAt: null,
      },
      data: {
        resolvedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to resolve storage cleanup failures:", error);
  }
}

export async function recordOrphanCleanupRun(input: {
  dryRun: boolean;
  courseId?: string;
  scanned: number;
  orphanCount: number;
  deletedCount: number;
  failureCount: number;
  triggeredById?: string;
  details: OrphanCleanupRunDetails;
}): Promise<void> {
  try {
    await prisma.storageCleanupRun.create({
      data: {
        dryRun: input.dryRun,
        courseId: input.courseId,
        scanned: input.scanned,
        orphanCount: input.orphanCount,
        deletedCount: input.deletedCount,
        failureCount: input.failureCount,
        triggeredById: input.triggeredById,
        details: input.details,
      },
    });
  } catch (error) {
    console.error("Failed to record orphan cleanup run:", error);
  }
}

export async function listStorageCleanupFailures(options: {
  resolved: boolean;
}) {
  return prisma.storageCleanupFailure.findMany({
    where: options.resolved
      ? { resolvedAt: { not: null } }
      : { resolvedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function listStorageCleanupRuns(limit: number) {
  return prisma.storageCleanupRun.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export type { StorageCleanupSource };
