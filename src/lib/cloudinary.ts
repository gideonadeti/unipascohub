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

type SignUploadError = "missing_config" | "course_not_found";

export type SignedUploadParams = {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  uploadPreset: string;
  assetFolder: string;
  resourceType: CloudinaryResourceTypeType;
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
  const paramsToSign = {
    timestamp,
    upload_preset: uploadPreset,
    asset_folder: assetFolder,
    resource_type: toCloudinaryApiResourceType(input.resourceType),
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
    },
  };
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
  { success: true } | { success: false; error: "cloudinary_delete_failed" }
> {
  for (const file of files) {
    const result = await deleteCloudinaryAsset(
      file.publicId,
      file.resourceType,
    );

    if (!result.success) {
      return result;
    }
  }

  return { success: true };
}
