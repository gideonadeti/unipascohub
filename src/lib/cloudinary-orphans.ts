import { v2 as cloudinary } from "cloudinary";

import {
  deleteCloudinaryAsset,
  fromCloudinaryApiResourceType,
  isCloudinaryNotFoundError,
} from "@/lib/cloudinary";
import { prisma } from "@/lib/db";
import {
  recordOrphanCleanupRun,
  recordStorageCleanupFailures,
  resolveStorageCleanupFailures,
} from "@/lib/storage-cleanup-log";
import {
  type CloudinaryResourceType as CloudinaryResourceTypeType,
  StorageCleanupSource,
} from "../../generated/prisma/enums";

type OrphanAsset = {
  publicId: string;
  resourceType: CloudinaryResourceTypeType;
};

type ResourcesByAssetFolderResponse = {
  resources?: Array<{ public_id: string; resource_type: string }>;
  next_cursor?: string | null;
};

async function listAssetsInFolder(assetFolder: string): Promise<OrphanAsset[]> {
  const assets: OrphanAsset[] = [];
  let nextCursor: string | undefined;

  do {
    let response: ResourcesByAssetFolderResponse;

    try {
      response = (await cloudinary.api.resources_by_asset_folder(assetFolder, {
        max_results: 500,
        ...(nextCursor !== undefined && { next_cursor: nextCursor }),
      })) as ResourcesByAssetFolderResponse;
    } catch (error) {
      if (isCloudinaryNotFoundError(error)) {
        return assets;
      }

      throw error;
    }

    for (const resource of response.resources ?? []) {
      const resourceType = fromCloudinaryApiResourceType(
        resource.resource_type,
      );

      if (resourceType !== null) {
        assets.push({
          publicId: resource.public_id,
          resourceType,
        });
      }
    }

    nextCursor = response.next_cursor ?? undefined;
  } while (nextCursor !== undefined && nextCursor.length > 0);

  return assets;
}

export async function cleanupOrphanCloudinaryAssets(options: {
  dryRun?: boolean;
  courseId?: string;
  triggeredById?: string;
}): Promise<{
  scanned: number;
  orphans: string[];
  deleted: string[];
  deleteFailures: string[];
}> {
  const dryRun = options.dryRun ?? true;

  const dbPublicIds = new Set(
    (
      await prisma.pascoFile.findMany({
        select: { publicId: true },
      })
    ).map((file) => file.publicId),
  );

  const courseIds = options.courseId
    ? [options.courseId]
    : (await prisma.course.findMany({ select: { id: true } })).map(
        (course) => course.id,
      );

  let scanned = 0;
  const orphanAssets: OrphanAsset[] = [];

  for (const courseId of courseIds) {
    const assets = await listAssetsInFolder(`pascos/${courseId}`);
    scanned += assets.length;

    for (const asset of assets) {
      if (!dbPublicIds.has(asset.publicId)) {
        orphanAssets.push(asset);
      }
    }
  }

  const orphans = orphanAssets.map((asset) => asset.publicId);
  const deleted: string[] = [];
  const deleteFailures: string[] = [];

  if (!dryRun && orphanAssets.length > 0) {
    const results = await Promise.all(
      orphanAssets.map(async (asset) => {
        const result = await deleteCloudinaryAsset(
          asset.publicId,
          asset.resourceType,
        );

        return { publicId: asset.publicId, result };
      }),
    );

    for (const entry of results) {
      if (entry.result.success) {
        deleted.push(entry.publicId);
        await resolveStorageCleanupFailures([entry.publicId]);
      } else {
        deleteFailures.push(entry.publicId);
      }
    }

    if (deleteFailures.length > 0) {
      const failedAssets = orphanAssets.filter((asset) =>
        deleteFailures.includes(asset.publicId),
      );

      await recordStorageCleanupFailures({
        files: failedAssets,
        source: StorageCleanupSource.ORPHAN_BATCH,
        triggeredById: options.triggeredById,
      });
    }
  }

  await recordOrphanCleanupRun({
    dryRun,
    courseId: options.courseId,
    scanned,
    orphanCount: orphans.length,
    deletedCount: deleted.length,
    failureCount: deleteFailures.length,
    triggeredById: options.triggeredById,
    details: {
      orphans,
      deleted,
      deleteFailures,
    },
  });

  return { scanned, orphans, deleted, deleteFailures };
}
