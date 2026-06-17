import { v2 as cloudinary } from "cloudinary";

import { deleteCloudinaryAsset } from "@/lib/cloudinary";
import { prisma } from "@/lib/db";
import {
  CloudinaryResourceType,
  type CloudinaryResourceType as CloudinaryResourceTypeType,
} from "../../generated/prisma/enums";

type OrphanAsset = {
  publicId: string;
  resourceType: CloudinaryResourceTypeType;
};

type ResourcesByAssetFolderResponse = {
  resources?: Array<{ public_id: string; resource_type: string }>;
  next_cursor?: string | null;
};

function mapCloudinaryResourceType(
  apiResourceType: string,
): CloudinaryResourceTypeType | null {
  if (apiResourceType === "image") {
    return CloudinaryResourceType.IMAGE;
  }

  if (apiResourceType === "raw") {
    return CloudinaryResourceType.RAW;
  }

  return null;
}

function isCloudinaryFolderNotFoundError(error: unknown): boolean {
  if (error === null || typeof error !== "object") {
    return false;
  }

  const record = error as { error?: { http_code?: number } };
  return record.error?.http_code === 404;
}

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
      if (isCloudinaryFolderNotFoundError(error)) {
        return assets;
      }

      throw error;
    }

    for (const resource of response.resources ?? []) {
      const resourceType = mapCloudinaryResourceType(resource.resource_type);

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
      } else {
        deleteFailures.push(entry.publicId);
      }
    }
  }

  return { scanned, orphans, deleted, deleteFailures };
}
