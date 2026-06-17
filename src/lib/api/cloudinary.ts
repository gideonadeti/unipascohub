import {
  inferPascoResourceType,
  isAllowedPascoFileName,
} from "@/lib/pasco-file-types";
import type { PascoFileCreateInput } from "@/lib/schemas/pasco-create";
import type { CloudinaryResourceType } from "@/types/api/pascos";
import type { CloudinaryWidgetUploadInfo } from "@/types/cloudinary-widget";

import { apiClient } from "./client";

export type CloudinarySignRequest = {
  courseId: string;
  resourceType: CloudinaryResourceType;
  fileName: string;
  widgetParams?: {
    timestamp: number;
    asset_folder: string;
    upload_preset: string;
    source: string;
  };
};

export type CloudinarySignResponse = {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  uploadPreset: string;
  assetFolder: string;
  resourceType: CloudinaryResourceType;
  uploadUrl: string;
};

export function inferResourceType(fileName: string): CloudinaryResourceType {
  return inferPascoResourceType(fileName);
}

export function signCloudinaryUpload(input: CloudinarySignRequest) {
  return apiClient
    .post<CloudinarySignResponse>("/api/cloudinary/sign", input)
    .then((response) => response.data);
}

function fromCloudinaryApiResourceType(
  value: string | undefined,
): CloudinaryResourceType {
  return value === "raw" ? "RAW" : "IMAGE";
}

export function resolveUploadedFileName(
  info: CloudinaryWidgetUploadInfo,
): string {
  const baseName =
    info.display_name ??
    info.original_filename ??
    info.public_id.split("/").pop() ??
    "file";

  if (!info.format) {
    return baseName;
  }

  const lowerBase = baseName.toLowerCase();
  const lowerFormat = info.format.toLowerCase();

  if (lowerBase.endsWith(`.${lowerFormat}`)) {
    return baseName;
  }

  return `${baseName}.${info.format}`;
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function resolvePrepareUploadFileName(params: unknown): string | null {
  if (params === null || typeof params !== "object") {
    return null;
  }

  const record = params as Record<string, unknown>;

  for (const key of ["file", "source"]) {
    const candidate = record[key];

    if (candidate instanceof File) {
      return readNonEmptyString(candidate.name);
    }

    if (
      candidate !== null &&
      typeof candidate === "object" &&
      "name" in candidate
    ) {
      const name = readNonEmptyString((candidate as { name?: unknown }).name);
      if (name) {
        return name;
      }
    }
  }

  for (const key of ["filename", "fileName", "name"]) {
    const name = readNonEmptyString(record[key]);
    if (name) {
      return name;
    }
  }

  if (typeof record.path === "string") {
    const baseName = record.path.split(/[/\\]/).pop();
    const name = readNonEmptyString(baseName);
    if (name) {
      return name;
    }
  }

  for (const key of ["publicId", "public_id"]) {
    const name = readNonEmptyString(record[key]);
    if (name && isAllowedPascoFileName(name)) {
      return name;
    }
  }

  return null;
}

export function extractWidgetSignParams(
  params: unknown,
): CloudinarySignRequest["widgetParams"] | null {
  if (params === null || typeof params !== "object") {
    return null;
  }

  const record = params as Record<string, unknown>;

  if (
    typeof record.timestamp !== "number" ||
    !Number.isFinite(record.timestamp) ||
    typeof record.asset_folder !== "string" ||
    typeof record.upload_preset !== "string" ||
    typeof record.source !== "string"
  ) {
    return null;
  }

  return {
    timestamp: record.timestamp,
    asset_folder: record.asset_folder,
    upload_preset: record.upload_preset,
    source: record.source,
  };
}

export function cloudinaryUploadInfoToPascoFile(
  info: CloudinaryWidgetUploadInfo,
  order: number,
  contentHash: string,
): PascoFileCreateInput {
  const fileName = resolveUploadedFileName(info);

  if (!isAllowedPascoFileName(fileName)) {
    throw new Error(
      "Unsupported file type. Upload PDFs, images, or document files only (no spreadsheets).",
    );
  }

  return {
    order,
    publicId: info.public_id,
    fileName,
    fileSize: info.bytes,
    fileUrl: info.secure_url,
    resourceType: fromCloudinaryApiResourceType(info.resource_type),
    contentHash,
  };
}
