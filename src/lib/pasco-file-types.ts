import type { CloudinaryResourceType } from "@/types/api/pascos";

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
