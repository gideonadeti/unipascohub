import { v2 as cloudinary } from "cloudinary";

import {
  CloudinaryResourceType,
  type CloudinaryResourceType as CloudinaryResourceTypeType,
} from "../../generated/prisma/enums";

const CLOUDINARY_RESOURCE_TYPES = new Set<string>(
  Object.values(CloudinaryResourceType),
);

export type SignUploadInput = {
  courseId: string;
  resourceType: CloudinaryResourceTypeType;
  fileName: string;
};

type SignUploadParseError =
  | "invalid_body"
  | "invalid_course_id"
  | "invalid_resource_type"
  | "invalid_file_name"
  | "invalid_pdf_resource_type";

type SignUploadError = "missing_config";

export type SignedUploadParams = {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  uploadPreset: string;
  assetFolder: string;
  resourceType: CloudinaryResourceTypeType;
  uploadUrl: string;
};

export type VerifyFileError =
  | "asset_not_found"
  | "asset_folder_mismatch"
  | "asset_size_mismatch"
  | "asset_url_mismatch"
  | "asset_resource_type_mismatch"
  | "invalid_pdf_resource_type";

export type VerifyCloudinaryFileInput = {
  publicId: string;
  fileUrl: string;
  fileSize: number;
  resourceType: CloudinaryResourceTypeType;
  expectedAssetFolder: string;
};

type CloudinaryResourceResponse = {
  asset_folder?: string;
  bytes?: number;
  format?: string;
  resource_type?: string;
  secure_url?: string;
};

function parseCourseId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const courseId = value.trim();

  if (courseId.length === 0) {
    return null;
  }

  return courseId;
}

function parseFileName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const fileName = value.trim();

  if (fileName.length === 0 || fileName.length > 255) {
    return null;
  }

  return fileName;
}

function isCloudinaryResourceType(
  value: string,
): value is CloudinaryResourceTypeType {
  return CLOUDINARY_RESOURCE_TYPES.has(value);
}

export function isPdfFileName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".pdf");
}

export function validatePdfResourceType(
  fileName: string,
  resourceType: CloudinaryResourceTypeType,
): boolean {
  if (isPdfFileName(fileName) && resourceType === CloudinaryResourceType.RAW) {
    return false;
  }

  return true;
}

function isPdfCloudinaryFormat(format: string): boolean {
  return format.toLowerCase() === "pdf";
}

export function parseSignUploadInput(
  body: unknown,
):
  | { success: true; data: SignUploadInput }
  | { success: false; error: SignUploadParseError } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "invalid_body" };
  }

  const record = body as Record<string, unknown>;

  if (
    !("courseId" in record) ||
    !("resourceType" in record) ||
    !("fileName" in record)
  ) {
    return { success: false, error: "invalid_body" };
  }

  const courseId = parseCourseId(record.courseId);
  const fileName = parseFileName(record.fileName);

  if (courseId === null) {
    return { success: false, error: "invalid_course_id" };
  }

  if (fileName === null) {
    return { success: false, error: "invalid_file_name" };
  }

  if (
    typeof record.resourceType !== "string" ||
    !isCloudinaryResourceType(record.resourceType)
  ) {
    return { success: false, error: "invalid_resource_type" };
  }

  if (!validatePdfResourceType(fileName, record.resourceType)) {
    return { success: false, error: "invalid_pdf_resource_type" };
  }

  return {
    success: true,
    data: {
      courseId,
      fileName,
      resourceType: record.resourceType,
    },
  };
}

export function toCloudinaryApiResourceType(
  resourceType: CloudinaryResourceTypeType,
): "image" | "raw" {
  return resourceType === CloudinaryResourceType.RAW ? "raw" : "image";
}

function fromCloudinaryApiResourceType(
  resourceType: string,
): CloudinaryResourceTypeType | null {
  if (resourceType === "image") {
    return CloudinaryResourceType.IMAGE;
  }

  if (resourceType === "raw") {
    return CloudinaryResourceType.RAW;
  }

  return null;
}

function isCloudinaryNotFoundError(error: unknown): boolean {
  if (error === null || typeof error !== "object") {
    return false;
  }

  const record = error as { error?: { http_code?: number } };
  return record.error?.http_code === 404;
}

function getUploadPreset(): string | null {
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!uploadPreset) {
    return null;
  }

  return uploadPreset;
}

export function signUploadParams(
  input: SignUploadInput,
):
  | { success: true; data: SignedUploadParams }
  | { success: false; error: SignUploadError } {
  const uploadPreset = getUploadPreset();
  const apiSecret = cloudinary.config().api_secret;
  const cloudName = cloudinary.config().cloud_name;
  const apiKey = cloudinary.config().api_key;

  if (!uploadPreset || !apiSecret || !cloudName || !apiKey) {
    return { success: false, error: "missing_config" };
  }

  const timestamp = Math.round(Date.now() / 1000);
  const assetFolder = `pascos/${input.courseId}`;
  const apiResourceType = toCloudinaryApiResourceType(input.resourceType);
  const paramsToSign = {
    timestamp,
    upload_preset: uploadPreset,
    asset_folder: assetFolder,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    success: true,
    data: {
      signature,
      timestamp,
      cloudName,
      apiKey,
      uploadPreset,
      assetFolder,
      resourceType: input.resourceType,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${apiResourceType}/upload`,
    },
  };
}

export async function verifyCloudinaryFile(
  input: VerifyCloudinaryFileInput,
): Promise<{ success: true } | { success: false; error: VerifyFileError }> {
  const apiResourceType = toCloudinaryApiResourceType(input.resourceType);

  let asset: CloudinaryResourceResponse;

  try {
    asset = (await cloudinary.api.resource(input.publicId, {
      resource_type: apiResourceType,
    })) as CloudinaryResourceResponse;
  } catch (error) {
    if (isCloudinaryNotFoundError(error)) {
      return { success: false, error: "asset_not_found" };
    }

    throw error;
  }

  if (asset.asset_folder !== input.expectedAssetFolder) {
    return { success: false, error: "asset_folder_mismatch" };
  }

  if (asset.bytes !== input.fileSize) {
    return { success: false, error: "asset_size_mismatch" };
  }

  if (asset.secure_url !== input.fileUrl) {
    return { success: false, error: "asset_url_mismatch" };
  }

  const cloudinaryResourceType =
    asset.resource_type === undefined
      ? null
      : fromCloudinaryApiResourceType(asset.resource_type);

  if (
    cloudinaryResourceType === null ||
    cloudinaryResourceType !== input.resourceType
  ) {
    return { success: false, error: "asset_resource_type_mismatch" };
  }

  if (
    asset.format !== undefined &&
    isPdfCloudinaryFormat(asset.format) &&
    input.resourceType === CloudinaryResourceType.RAW
  ) {
    return { success: false, error: "invalid_pdf_resource_type" };
  }

  return { success: true };
}

export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: CloudinaryResourceTypeType,
): Promise<
  { success: true } | { success: false; error: "cloudinary_delete_failed" }
> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: toCloudinaryApiResourceType(resourceType),
      invalidate: true,
    });

    if (result.result === "ok" || result.result === "not found") {
      return { success: true };
    }

    console.error("Cloudinary delete failed:", { publicId, result });
    return { success: false, error: "cloudinary_delete_failed" };
  } catch (error) {
    console.error("Cloudinary delete error:", { publicId, error });
    return { success: false, error: "cloudinary_delete_failed" };
  }
}

export async function deleteCloudinaryAssets(
  files: Array<{
    publicId: string;
    resourceType: CloudinaryResourceTypeType;
  }>,
): Promise<
  | { success: true }
  | {
      success: false;
      error: "cloudinary_delete_failed";
      failedPublicIds: string[];
    }
> {
  const results = await Promise.all(
    files.map(async (file) => {
      const result = await deleteCloudinaryAsset(
        file.publicId,
        file.resourceType,
      );

      return { publicId: file.publicId, result };
    }),
  );

  const failedPublicIds = results
    .filter((entry) => !entry.result.success)
    .map((entry) => entry.publicId);

  if (failedPublicIds.length > 0) {
    return {
      success: false,
      error: "cloudinary_delete_failed",
      failedPublicIds,
    };
  }

  return { success: true };
}
