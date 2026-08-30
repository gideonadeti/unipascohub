import { createHash } from "node:crypto";
import * as Sentry from "@sentry/nextjs";
import { v2 as cloudinary } from "cloudinary";
import { logError } from "@/lib/logger";
import { parseNonEmptyString } from "@/lib/parse";
import {
  isAllowedPascoFileFormat,
  isAllowedPascoFileName,
} from "@/lib/pasco-file-types";
import {
  recordStorageCleanupFailures,
  resolveStorageCleanupFailures,
} from "@/lib/storage-cleanup-log";
import {
  CloudinaryResourceType,
  type CloudinaryResourceType as CloudinaryResourceTypeType,
  type StorageCleanupSource,
} from "../../generated/prisma/enums";

const CLOUDINARY_RESOURCE_TYPES = new Set<string>(
  Object.values(CloudinaryResourceType),
);

export type SignUploadInput = {
  courseId: string;
  resourceType: CloudinaryResourceTypeType;
  fileName: string;
  widgetParams?: WidgetSignParams;
};

export type WidgetSignParams = {
  timestamp: number;
  asset_folder: string;
  upload_preset: string;
  source: string;
};

type SignUploadParseError =
  | "invalid_body"
  | "invalid_course_id"
  | "invalid_resource_type"
  | "invalid_file_name"
  | "invalid_pdf_resource_type"
  | "unsupported_file_type"
  | "invalid_widget_params";

type SignUploadError = "missing_config" | "invalid_widget_params";

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
  | "invalid_pdf_resource_type"
  | "unsupported_file_type";

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
  type?: string;
};

async function fetchCloudinaryResource(
  publicId: string,
  apiResourceType: "image" | "raw",
): Promise<
  | { success: true; asset: CloudinaryResourceResponse }
  | { success: false; error: "asset_not_found" }
> {
  try {
    const asset = (await cloudinary.api.resource(publicId, {
      resource_type: apiResourceType,
    })) as CloudinaryResourceResponse;

    return { success: true, asset };
  } catch (error) {
    if (isCloudinaryNotFoundError(error)) {
      return { success: false, error: "asset_not_found" };
    }

    throw error;
  }
}

function resolveAssetDownloadFormat(
  asset: CloudinaryResourceResponse,
  fileName: string,
): string {
  if (typeof asset.format === "string" && asset.format.length > 0) {
    return asset.format;
  }

  const extension = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase()
    : undefined;

  return extension && extension.length > 0 ? extension : "bin";
}

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

function parseWidgetSignParams(value: unknown): WidgetSignParams | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.timestamp !== "number" ||
    !Number.isFinite(record.timestamp) ||
    typeof record.asset_folder !== "string" ||
    record.asset_folder.trim().length === 0 ||
    typeof record.upload_preset !== "string" ||
    record.upload_preset.trim().length === 0 ||
    typeof record.source !== "string" ||
    record.source.trim().length === 0
  ) {
    return null;
  }

  return {
    timestamp: record.timestamp,
    asset_folder: record.asset_folder.trim(),
    upload_preset: record.upload_preset.trim(),
    source: record.source.trim(),
  };
}

function validateWidgetSignParams(
  courseId: string,
  uploadPreset: string,
  widgetParams: WidgetSignParams,
): boolean {
  const expectedAssetFolder = `pascos/${courseId}`;

  return (
    widgetParams.asset_folder === expectedAssetFolder &&
    widgetParams.upload_preset === uploadPreset &&
    widgetParams.source === "uw"
  );
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

  if (!isAllowedPascoFileName(fileName)) {
    return { success: false, error: "unsupported_file_type" };
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

  let widgetParams: WidgetSignParams | undefined;

  if ("widgetParams" in record && record.widgetParams !== undefined) {
    const parsedWidgetParams = parseWidgetSignParams(record.widgetParams);

    if (parsedWidgetParams === null) {
      return { success: false, error: "invalid_widget_params" };
    }

    widgetParams = parsedWidgetParams;
  }

  return {
    success: true,
    data: {
      courseId,
      fileName,
      resourceType: record.resourceType,
      widgetParams,
    },
  };
}

export function toCloudinaryApiResourceType(
  resourceType: CloudinaryResourceTypeType,
): "image" | "raw" {
  return resourceType === CloudinaryResourceType.RAW ? "raw" : "image";
}

export function fromCloudinaryApiResourceType(
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

export function isCloudinaryNotFoundError(error: unknown): boolean {
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
  Sentry.addBreadcrumb({
    category: "cloudinary",
    message: "Signing upload params",
    data: { courseId: input.courseId, fileName: input.fileName },
  });

  const uploadPreset = getUploadPreset();
  const apiSecret = cloudinary.config().api_secret;
  const cloudName = cloudinary.config().cloud_name;
  const apiKey = cloudinary.config().api_key;

  if (!uploadPreset || !apiSecret || !cloudName || !apiKey) {
    return { success: false, error: "missing_config" };
  }

  const assetFolder = `pascos/${input.courseId}`;
  const apiResourceType = toCloudinaryApiResourceType(input.resourceType);

  if (
    input.widgetParams &&
    !validateWidgetSignParams(input.courseId, uploadPreset, input.widgetParams)
  ) {
    return { success: false, error: "invalid_widget_params" };
  }

  const paramsToSign = input.widgetParams
    ? {
        asset_folder: input.widgetParams.asset_folder,
        source: input.widgetParams.source,
        timestamp: input.widgetParams.timestamp,
        upload_preset: input.widgetParams.upload_preset,
      }
    : {
        asset_folder: assetFolder,
        source: "uw",
        timestamp: Math.round(Date.now() / 1000),
        upload_preset: uploadPreset,
      };

  const timestamp = paramsToSign.timestamp;
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

export type ComputeCloudinaryFileHashParseInput = {
  courseId: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  resourceType: CloudinaryResourceTypeType;
};

type ComputeCloudinaryFileHashParseError =
  | "invalid_body"
  | "invalid_course_id"
  | "invalid_public_id"
  | "invalid_file_name"
  | "invalid_file_size"
  | "invalid_file_url"
  | "invalid_resource_type"
  | "invalid_pdf_resource_type"
  | "unsupported_file_type"
  | "file_size_exceeded";

const MAX_PUBLIC_ID_LENGTH = 255;
const MAX_FILE_URL_LENGTH = 2048;

function parsePositiveInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.trunc(value);
}

function getMaxPascoFileSizeBytes(): number {
  const raw = process.env.PASCO_MAX_FILE_SIZE_BYTES;
  const parsed = raw ? Number.parseInt(raw, 10) : 5_242_880;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5_242_880;
}

export function parseComputeCloudinaryFileHashInput(
  body: unknown,
):
  | { success: true; data: ComputeCloudinaryFileHashParseInput }
  | { success: false; error: ComputeCloudinaryFileHashParseError } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "invalid_body" };
  }

  const record = body as Record<string, unknown>;
  const requiredFields = [
    "courseId",
    "publicId",
    "fileName",
    "fileSize",
    "fileUrl",
    "resourceType",
  ] as const;

  if (!requiredFields.every((field) => field in record)) {
    return { success: false, error: "invalid_body" };
  }

  const courseId = parseCourseId(record.courseId);
  const publicId = parseNonEmptyString(record.publicId, MAX_PUBLIC_ID_LENGTH);
  const fileName = parseFileName(record.fileName);
  const fileSize = parsePositiveInt(record.fileSize);
  const fileUrl = parseNonEmptyString(record.fileUrl, MAX_FILE_URL_LENGTH);

  if (courseId === null) {
    return { success: false, error: "invalid_course_id" };
  }

  if (publicId === null) {
    return { success: false, error: "invalid_public_id" };
  }

  if (fileName === null) {
    return { success: false, error: "invalid_file_name" };
  }

  if (fileSize === null) {
    return { success: false, error: "invalid_file_size" };
  }

  if (fileSize > getMaxPascoFileSizeBytes()) {
    return { success: false, error: "file_size_exceeded" };
  }

  if (!isAllowedPascoFileName(fileName)) {
    return { success: false, error: "unsupported_file_type" };
  }

  if (fileUrl === null) {
    return { success: false, error: "invalid_file_url" };
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
      publicId,
      fileName,
      fileSize,
      fileUrl,
      resourceType: record.resourceType,
    },
  };
}

export async function verifyCloudinaryFile(
  input: VerifyCloudinaryFileInput,
): Promise<{ success: true } | { success: false; error: VerifyFileError }> {
  const apiResourceType = toCloudinaryApiResourceType(input.resourceType);

  const fetched = await fetchCloudinaryResource(
    input.publicId,
    apiResourceType,
  );

  if (!fetched.success) {
    return fetched;
  }

  const asset = fetched.asset;

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

  if (asset.format !== undefined && !isAllowedPascoFileFormat(asset.format)) {
    return { success: false, error: "unsupported_file_type" };
  }

  return { success: true };
}

export type SignedCloudinaryDownloadUrlInput = {
  publicId: string;
  fileName: string;
  resourceType: CloudinaryResourceTypeType;
};

export type SignedCloudinaryDownloadUrlError =
  | "asset_not_found"
  | "missing_config"
  | "signed_url_failed";

function getPascoDownloadUrlTtlSeconds(): number {
  const raw = process.env.PASCO_DOWNLOAD_URL_TTL_SECONDS;
  const parsed = raw ? Number.parseInt(raw, 10) : 300;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 300;
}

function buildSignedDownloadUrl(
  asset: CloudinaryResourceResponse,
  publicId: string,
  fileName: string,
  apiResourceType: "image" | "raw",
): string {
  const downloadFormat = resolveAssetDownloadFormat(asset, fileName);
  const deliveryType = asset.type ?? "upload";

  return cloudinary.utils.private_download_url(publicId, downloadFormat, {
    resource_type: apiResourceType,
    type: deliveryType,
    expires_at: Math.floor(Date.now() / 1000) + getPascoDownloadUrlTtlSeconds(),
  });
}

export async function createSignedCloudinaryDownloadUrl(
  input: SignedCloudinaryDownloadUrlInput,
): Promise<
  | { success: true; url: string }
  | { success: false; error: SignedCloudinaryDownloadUrlError }
> {
  const apiResourceType = toCloudinaryApiResourceType(input.resourceType);

  const fetched = await fetchCloudinaryResource(
    input.publicId,
    apiResourceType,
  );

  if (!fetched.success) {
    return fetched;
  }

  const asset = fetched.asset;

  const apiSecret = cloudinary.config().api_secret;
  const cloudName = cloudinary.config().cloud_name;

  if (!apiSecret || !cloudName) {
    return { success: false, error: "missing_config" };
  }

  try {
    return {
      success: true,
      url: buildSignedDownloadUrl(
        asset,
        input.publicId,
        input.fileName,
        apiResourceType,
      ),
    };
  } catch (error) {
    logError("Cloudinary signed download URL failed", {
      publicId: input.publicId,
      error,
    });

    return { success: false, error: "signed_url_failed" };
  }
}

export type HashCloudinaryFileError =
  | VerifyFileError
  | "missing_config"
  | "download_failed";

export type ComputeCloudinaryFileHashInput = VerifyCloudinaryFileInput & {
  fileName: string;
};

export async function hashCloudinaryFile(
  input: ComputeCloudinaryFileHashInput,
): Promise<
  | { success: true; contentHash: string }
  | { success: false; error: HashCloudinaryFileError }
> {
  Sentry.addBreadcrumb({
    category: "cloudinary",
    message: "Hashing Cloudinary file",
    data: { publicId: input.publicId, fileName: input.fileName },
  });

  const apiResourceType = toCloudinaryApiResourceType(input.resourceType);

  const fetched = await fetchCloudinaryResource(
    input.publicId,
    apiResourceType,
  );

  if (!fetched.success) {
    return fetched;
  }

  const asset = fetched.asset;

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

  if (asset.format !== undefined && !isAllowedPascoFileFormat(asset.format)) {
    return { success: false, error: "unsupported_file_type" };
  }

  const apiSecret = cloudinary.config().api_secret;
  const cloudName = cloudinary.config().cloud_name;

  if (!apiSecret || !cloudName) {
    return { success: false, error: "missing_config" };
  }

  const downloadUrl = buildSignedDownloadUrl(
    asset,
    input.publicId,
    input.fileName,
    apiResourceType,
  );

  const response = await fetch(downloadUrl);

  if (!response.ok) {
    return { success: false, error: "download_failed" };
  }

  const contentHash = createHash("sha256")
    .update(Buffer.from(await response.arrayBuffer()))
    .digest("hex");

  return { success: true, contentHash };
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

    logError("Cloudinary delete failed", { publicId, result });
    return { success: false, error: "cloudinary_delete_failed" };
  } catch (error) {
    logError("Cloudinary delete error", { publicId, error });
    return { success: false, error: "cloudinary_delete_failed" };
  }
}

export type StorageCleanupContext = {
  source: StorageCleanupSource;
  pascoId?: string;
  triggeredById?: string;
};

export async function deleteCloudinaryAssets(
  files: Array<{
    publicId: string;
    resourceType: CloudinaryResourceTypeType;
  }>,
  cleanupContext?: StorageCleanupContext,
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

      if (cleanupContext !== undefined) {
        if (result.success) {
          await resolveStorageCleanupFailures([file.publicId]);
        } else {
          await recordStorageCleanupFailures({
            files: [file],
            source: cleanupContext.source,
            pascoId: cleanupContext.pascoId,
            triggeredById: cleanupContext.triggeredById,
          });
        }
      }

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
