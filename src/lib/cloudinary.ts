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
  mimeType: string;
};

type SignUploadParseError =
  | "invalid_body"
  | "invalid_course_id"
  | "invalid_resource_type"
  | "invalid_mime_type"
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
  | "asset_mime_mismatch";

export type VerifyCloudinaryFileInput = {
  publicId: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
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

function parseMimeType(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const mimeType = value.trim().toLowerCase();

  if (mimeType.length === 0) {
    return null;
  }

  return mimeType;
}

function isCloudinaryResourceType(
  value: string,
): value is CloudinaryResourceTypeType {
  return CLOUDINARY_RESOURCE_TYPES.has(value);
}

export function isPdfMimeType(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

export function validatePdfResourceType(
  mimeType: string,
  resourceType: CloudinaryResourceTypeType,
): boolean {
  if (isPdfMimeType(mimeType) && resourceType === CloudinaryResourceType.RAW) {
    return false;
  }

  return true;
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
    !("mimeType" in record)
  ) {
    return { success: false, error: "invalid_body" };
  }

  const courseId = parseCourseId(record.courseId);
  const mimeType = parseMimeType(record.mimeType);

  if (courseId === null) {
    return { success: false, error: "invalid_course_id" };
  }

  if (mimeType === null) {
    return { success: false, error: "invalid_mime_type" };
  }

  if (
    typeof record.resourceType !== "string" ||
    !isCloudinaryResourceType(record.resourceType)
  ) {
    return { success: false, error: "invalid_resource_type" };
  }

  if (!validatePdfResourceType(mimeType, record.resourceType)) {
    return { success: false, error: "invalid_pdf_resource_type" };
  }

  return {
    success: true,
    data: {
      courseId,
      mimeType,
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

const FORMAT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  zip: "application/zip",
};

function mimeMatchesCloudinaryFormat(
  mimeType: string,
  format: string,
): boolean {
  const normalizedFormat = format.toLowerCase();
  const normalizedMime = mimeType.toLowerCase();

  const expectedMime = FORMAT_TO_MIME[normalizedFormat];

  if (expectedMime !== undefined) {
    return normalizedMime === expectedMime;
  }

  if (
    ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "svg"].includes(
      normalizedFormat,
    )
  ) {
    return normalizedMime.startsWith("image/");
  }

  return (
    normalizedMime.includes(normalizedFormat) ||
    normalizedMime.endsWith(`/${normalizedFormat}`)
  );
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
    asset.format === undefined ||
    !mimeMatchesCloudinaryFormat(input.mimeType, asset.format)
  ) {
    return { success: false, error: "asset_mime_mismatch" };
  }

  if (!validatePdfResourceType(input.mimeType, input.resourceType)) {
    return { success: false, error: "asset_mime_mismatch" };
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
