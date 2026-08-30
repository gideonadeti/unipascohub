import { ApiError } from "@/lib/api/client";
import type { CloudinaryResourceType } from "@/types/api/pascos";

export const PASCO_UPLOAD_FAILED_MESSAGE = "File upload failed";

const TECHNICAL_UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  "Cloudinary is not configured":
    "Uploads are temporarily unavailable. Please try again later.",
  "Invalid widget upload parameters":
    "Could not start upload. Please try again.",
};

function mapTechnicalUploadMessage(message: string): string | null {
  return TECHNICAL_UPLOAD_ERROR_MESSAGES[message] ?? null;
}

function sanitizeUploadMessage(message: string): string {
  const trimmed = message.trim();

  if (!trimmed) {
    return PASCO_UPLOAD_FAILED_MESSAGE;
  }

  const mapped = mapTechnicalUploadMessage(trimmed);

  if (mapped) {
    return mapped;
  }

  if (/cloudinary/i.test(trimmed)) {
    return PASCO_UPLOAD_FAILED_MESSAGE;
  }

  return trimmed;
}

export function getPascoUploadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const mapped = mapTechnicalUploadMessage(error.message);

    if (mapped) {
      return mapped;
    }
  }

  if (error instanceof Error) {
    const mapped = mapTechnicalUploadMessage(error.message);

    if (mapped) {
      return mapped;
    }
  }

  const fromWidget = extractCloudinaryWidgetErrorMessage(error);

  return sanitizeUploadMessage(fromWidget);
}

export const PASCO_IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
] as const;

export const PASCO_PDF_EXTENSIONS = ["pdf"] as const;

export const PASCO_DOCUMENT_EXTENSIONS = [
  "doc",
  "docx",
  "txt",
  "rtf",
  "odt",
] as const;

export const PASCO_SPREADSHEET_EXTENSIONS = [
  "xls",
  "xlsx",
  "csv",
  "ods",
  "tsv",
  "numbers",
] as const;

export const PASCO_ALLOWED_EXTENSIONS = [
  ...PASCO_IMAGE_EXTENSIONS,
  ...PASCO_PDF_EXTENSIONS,
  ...PASCO_DOCUMENT_EXTENSIONS,
] as const;

export const PASCO_WIDGET_ALLOWED_FORMATS = [...PASCO_ALLOWED_EXTENSIONS];

export const PASCO_UPLOAD_ACCEPT_DESCRIPTION =
  "PDF, images (JPG, PNG, WebP, GIF), and documents (DOC, DOCX, TXT, RTF, ODT). Spreadsheets are not supported.";

export const PASCO_UPLOAD_REJECTED_MESSAGE =
  "Only PDF, image, and document files are allowed. Spreadsheets are not supported.";

export const PASCO_FILE_COMPRESSOR_NAME = "iLovePDF";
export const PASCO_FILE_COMPRESSOR_URL =
  "https://www.ilovepdf.com/compress_pdf";

export function getPascoFileTooLargeMessage(maxBytes: number): string {
  const maxMb =
    maxBytes % 1_048_576 === 0
      ? String(maxBytes / 1_048_576)
      : (maxBytes / 1_048_576).toFixed(1);

  return `This file is too large (max ${maxMb} MB per file). Compress it for free with ${PASCO_FILE_COMPRESSOR_NAME} (${PASCO_FILE_COMPRESSOR_URL}) and try again.`;
}

export function isPascoFileSizeError(message: string): boolean {
  return /file size|too large|too big|exceeds|maximum allowed|larger than|max(?:imum)?\s+(?:allowed|file\s+size|size)/i.test(
    message,
  );
}

export function parseMaxFileSizeBytesFromError(message: string): number | null {
  const patterns = [
    /maximum allowed \((\d+) bytes\)/i,
    /maximum allowed[:\s]+(\d+)/i,
    /max(?:imum)? file size(?: is)?[:\s]+(\d+)/i,
    /Max file size is (\d+)/i,
    /larger than (\d+) bytes/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(message);

    if (match) {
      return Number.parseInt(match[1], 10);
    }
  }

  return null;
}

export function extractCloudinaryWidgetErrorMessage(error: unknown): string {
  if (error == null) {
    return PASCO_UPLOAD_FAILED_MESSAGE;
  }

  if (typeof error === "string") {
    const trimmed = error.trim();

    return trimmed || PASCO_UPLOAD_FAILED_MESSAGE;
  }

  if (error instanceof Error) {
    const trimmed = error.message.trim();

    return trimmed || PASCO_UPLOAD_FAILED_MESSAGE;
  }

  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const fields = ["message", "error", "statusText", "reason"];

    for (const field of fields) {
      const value = record[field];

      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }

    if (record.error != null && record.error !== error) {
      const nested = extractCloudinaryWidgetErrorMessage(record.error);

      if (nested !== PASCO_UPLOAD_FAILED_MESSAGE) {
        return nested;
      }
    }
  }

  return PASCO_UPLOAD_FAILED_MESSAGE;
}

export function resolvePascoFileSizeErrorMessage(
  message: string,
  fallbackMaxBytes: number,
): string {
  if (!isPascoFileSizeError(message)) {
    return message;
  }

  return getPascoFileTooLargeMessage(
    parseMaxFileSizeBytesFromError(message) ?? fallbackMaxBytes,
  );
}

export function getPreBatchFileSize(file: unknown): number | undefined {
  if (file == null || typeof file !== "object") {
    return undefined;
  }

  const size = (file as { size?: unknown }).size;

  return typeof size === "number" ? size : undefined;
}

export function readPreBatchFileName(file: unknown): string | null {
  if (file == null || typeof file !== "object") {
    return null;
  }

  const name = (file as { name?: unknown }).name;

  return typeof name === "string" && name.length > 0 ? name : null;
}

export function getFileExtension(fileName: string): string {
  const trimmed = fileName.trim().toLowerCase();
  const dotIndex = trimmed.lastIndexOf(".");

  if (dotIndex === -1 || dotIndex === trimmed.length - 1) {
    return "";
  }

  return trimmed.slice(dotIndex + 1);
}

export function isSpreadsheetFileName(fileName: string): boolean {
  const extension = getFileExtension(fileName);

  return PASCO_SPREADSHEET_EXTENSIONS.includes(
    extension as (typeof PASCO_SPREADSHEET_EXTENSIONS)[number],
  );
}

export function isAllowedPascoFileName(fileName: string): boolean {
  const extension = getFileExtension(fileName);

  if (!extension || isSpreadsheetFileName(fileName)) {
    return false;
  }

  return PASCO_ALLOWED_EXTENSIONS.includes(
    extension as (typeof PASCO_ALLOWED_EXTENSIONS)[number],
  );
}

export function isAllowedPascoFileFormat(format: string): boolean {
  const normalized = format.trim().toLowerCase();

  return PASCO_ALLOWED_EXTENSIONS.includes(
    normalized as (typeof PASCO_ALLOWED_EXTENSIONS)[number],
  );
}

export function isPascoPdfFileName(fileName: string): boolean {
  const extension = getFileExtension(fileName);

  return PASCO_PDF_EXTENSIONS.includes(
    extension as (typeof PASCO_PDF_EXTENSIONS)[number],
  );
}

export function isPascoImageFileName(fileName: string): boolean {
  const extension = getFileExtension(fileName);

  return PASCO_IMAGE_EXTENSIONS.includes(
    extension as (typeof PASCO_IMAGE_EXTENSIONS)[number],
  );
}

export type PascoFileViewKind = "pdf" | "image" | "download-only";

export function getPascoFileViewKind(fileName: string): PascoFileViewKind {
  if (isPascoPdfFileName(fileName)) {
    return "pdf";
  }

  if (isPascoImageFileName(fileName)) {
    return "image";
  }

  return "download-only";
}

export function inferPascoResourceType(
  fileName: string,
): CloudinaryResourceType {
  const extension = getFileExtension(fileName);

  if (
    extension === "pdf" ||
    PASCO_IMAGE_EXTENSIONS.includes(
      extension as (typeof PASCO_IMAGE_EXTENSIONS)[number],
    )
  ) {
    return "IMAGE";
  }

  return "RAW";
}
