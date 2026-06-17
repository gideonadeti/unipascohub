import type {
  StorageCleanupFailure,
  StorageCleanupRun,
} from "../../../generated/prisma/client";

export type SerializedStorageCleanupFailure = {
  id: string;
  publicId: string;
  resourceType: StorageCleanupFailure["resourceType"];
  source: StorageCleanupFailure["source"];
  pascoId: string | null;
  triggeredById: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type SerializedStorageCleanupRun = {
  id: string;
  dryRun: boolean;
  courseId: string | null;
  scanned: number;
  orphanCount: number;
  deletedCount: number;
  failureCount: number;
  triggeredById: string | null;
  details: StorageCleanupRun["details"];
  createdAt: string;
  updatedAt: string;
};

export type StorageCleanupFailuresResponse = {
  failures: SerializedStorageCleanupFailure[];
};

export type StorageCleanupRunsResponse = {
  runs: SerializedStorageCleanupRun[];
};

export function serializeStorageCleanupFailure(
  failure: StorageCleanupFailure,
): SerializedStorageCleanupFailure {
  return {
    id: failure.id,
    publicId: failure.publicId,
    resourceType: failure.resourceType,
    source: failure.source,
    pascoId: failure.pascoId,
    triggeredById: failure.triggeredById,
    createdAt: failure.createdAt.toISOString(),
    updatedAt: failure.updatedAt.toISOString(),
    resolvedAt: failure.resolvedAt?.toISOString() ?? null,
  };
}

export function serializeStorageCleanupRun(
  run: StorageCleanupRun,
): SerializedStorageCleanupRun {
  return {
    id: run.id,
    dryRun: run.dryRun,
    courseId: run.courseId,
    scanned: run.scanned,
    orphanCount: run.orphanCount,
    deletedCount: run.deletedCount,
    failureCount: run.failureCount,
    triggeredById: run.triggeredById,
    details: run.details,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  };
}
