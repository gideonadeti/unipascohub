"use client";

import { Trash2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import {
  cloudinaryUploadInfoToPascoFile,
  extractWidgetSignParams,
  inferResourceType,
  resolvePrepareUploadFileName,
  resolveUploadedFileName,
  signCloudinaryUpload,
} from "@/lib/api/cloudinary";
import {
  checkPascoFileDuplicates,
  computePascoFileHash,
} from "@/lib/api/pascos";
import { formatDuplicateFileMessage } from "@/lib/content-hash";
import {
  extractCloudinaryWidgetErrorMessage,
  getPascoFileTooLargeMessage,
  getPreBatchFileSize,
  isAllowedPascoFileName,
  isPascoFileSizeError,
  PASCO_UPLOAD_ACCEPT_DESCRIPTION,
  PASCO_UPLOAD_REJECTED_MESSAGE,
  PASCO_WIDGET_ALLOWED_FORMATS,
  readPreBatchFileName,
  resolvePascoFileSizeErrorMessage,
} from "@/lib/pasco-file-types";
import {
  PASCO_MAX_FILE_SIZE_BYTES,
  PASCO_MAX_FILES,
} from "@/lib/schemas/pasco-create";
import type { PascoFileCreateInput } from "@/types/api/pascos";
import type {
  CloudinaryPreBatchCallbackResult,
  CloudinaryPreBatchData,
  CloudinaryPrepareUploadParams,
  CloudinaryUploadWidget,
  CloudinaryWidgetResult,
} from "@/types/cloudinary-widget";

const CLOUDINARY_WIDGET_SCRIPT =
  "https://upload-widget.cloudinary.com/global/all.js";

type UploadIssueAlert = {
  message: string;
  pascoId?: string;
  fileName?: string;
};

type PascoCloudinaryUploadProps = {
  courseId: string;
  files: PascoFileCreateInput[];
  filesError?: { message?: string };
  disabled?: boolean;
  maxFiles?: number;
  onFilesChange: (files: PascoFileCreateInput[]) => void;
};

const UPLOAD_ERROR_TOAST_ID = "pasco-upload-error";
const UPLOAD_FILE_SIZE_TOAST_DURATION_MS = 30_000;

function showUploadError(message: string) {
  const isFileSizeError = isPascoFileSizeError(message);

  toast.error(
    isFileSizeError
      ? resolvePascoFileSizeErrorMessage(message, PASCO_MAX_FILE_SIZE_BYTES)
      : message,
    {
      id: UPLOAD_ERROR_TOAST_ID,
      ...(isFileSizeError && {
        duration: UPLOAD_FILE_SIZE_TOAST_DURATION_MS,
      }),
    },
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1_048_576) {
    return `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;
  }

  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function loadCloudinaryWidgetScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.cloudinary?.createUploadWidget) {
    return Promise.resolve();
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${CLOUDINARY_WIDGET_SCRIPT}"]`,
  );

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Cloudinary Upload Widget")),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CLOUDINARY_WIDGET_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Cloudinary Upload Widget"));
    document.body.appendChild(script);
  });
}

function rejectPreBatchUpload(
  callback: (result?: CloudinaryPreBatchCallbackResult) => void,
  message: string,
) {
  showUploadError(message);
  callback({ cancel: true, error: message });
}

function rejectPrepareUpload(
  callback: (
    prepared:
      | Record<string, unknown>
      | Record<string, unknown>[]
      | { cancel: true; error?: string },
  ) => void,
  message: string,
) {
  showUploadError(message);
  callback({ cancel: true, error: message });
}

export function PascoCloudinaryUpload({
  courseId,
  files,
  filesError,
  disabled = false,
  maxFiles = PASCO_MAX_FILES,
  onFilesChange,
}: PascoCloudinaryUploadProps) {
  const widgetRef = useRef<CloudinaryUploadWidget | null>(null);
  const filesRef = useRef(files);
  const courseIdRef = useRef(courseId);
  const preBatchFileNamesRef = useRef<string[]>([]);
  const batchContentHashesRef = useRef<Set<string>>(new Set());
  const uploadSuccessQueueRef = useRef(Promise.resolve());
  const isOpeningRef = useRef(false);
  const openingFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [uploadIssue, setUploadIssue] = useState<UploadIssueAlert | null>(null);

  filesRef.current = files;
  courseIdRef.current = courseId;

  const clearOpeningFallbackTimer = useCallback(() => {
    if (openingFallbackTimerRef.current !== null) {
      clearTimeout(openingFallbackTimerRef.current);
      openingFallbackTimerRef.current = null;
    }
  }, []);

  const finishOpening = useCallback(() => {
    clearOpeningFallbackTimer();
    isOpeningRef.current = false;
    setIsOpening(false);
  }, [clearOpeningFallbackTimer]);

  const startOpeningFallbackTimer = useCallback(() => {
    clearOpeningFallbackTimer();
    openingFallbackTimerRef.current = setTimeout(() => {
      finishOpening();
    }, 15_000);
  }, [clearOpeningFallbackTimer, finishOpening]);

  useEffect(() => {
    return () => {
      clearOpeningFallbackTimer();
    };
  }, [clearOpeningFallbackTimer]);

  useEffect(() => {
    let cancelled = false;

    loadCloudinaryWidgetScript()
      .then(() => {
        if (!cancelled) {
          setIsScriptReady(true);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load Cloudinary Upload Widget";
          showUploadError(message);
        }
      });

    return () => {
      cancelled = true;
      widgetRef.current?.destroy();
      widgetRef.current = null;
    };
  }, []);

  const handleWidgetResult = useCallback(
    (error: unknown, result: CloudinaryWidgetResult) => {
      if (error) {
        finishOpening();
        setIsWidgetOpen(false);
        showUploadError(extractCloudinaryWidgetErrorMessage(error));
        return;
      }

      if (result.event === "display-changed") {
        if (result.info === "shown") {
          finishOpening();
          setIsWidgetOpen(true);
        } else if (result.info === "hidden") {
          setIsWidgetOpen(false);
        }
        return;
      }

      if (result.event === "close" || result.event === "abort") {
        finishOpening();
        setIsWidgetOpen(false);
        return;
      }

      if (
        result.event === "success" &&
        result.info &&
        typeof result.info === "object"
      ) {
        const uploadInfo = result.info;

        if (!uploadInfo || typeof uploadInfo !== "object") {
          showUploadError("Could not verify file fingerprint.");
          return;
        }

        uploadSuccessQueueRef.current = uploadSuccessQueueRef.current.then(
          async () => {
            try {
              const fileName = resolveUploadedFileName(uploadInfo);
              const { contentHash } = await computePascoFileHash({
                courseId: courseIdRef.current,
                publicId: uploadInfo.public_id,
                fileName,
                fileSize: uploadInfo.bytes,
                fileUrl: uploadInfo.secure_url,
                resourceType:
                  uploadInfo.resource_type === "raw" ? "RAW" : "IMAGE",
              });

              if (batchContentHashesRef.current.has(contentHash)) {
                setUploadIssue({
                  message: "Duplicate files detected in this selection.",
                  fileName,
                });
                return;
              }

              const duplicateCheck = await checkPascoFileDuplicates(
                courseIdRef.current,
                [contentHash],
              );

              if (duplicateCheck.duplicates.length > 0) {
                const duplicate = duplicateCheck.duplicates[0];
                const message = formatDuplicateFileMessage(duplicate);

                setUploadIssue({
                  message,
                  pascoId: duplicate.pascoId,
                  fileName: duplicate.fileName,
                });
                return;
              }

              batchContentHashesRef.current.add(contentHash);

              const currentFiles = filesRef.current;
              const nextOrder =
                currentFiles.length > 0
                  ? Math.max(...currentFiles.map((file) => file.order)) + 1
                  : 1;

              const uploadedFile = cloudinaryUploadInfoToPascoFile(
                uploadInfo,
                nextOrder,
                contentHash,
              );
              const nextFiles = [...currentFiles, uploadedFile];

              filesRef.current = nextFiles;
              onFilesChange(nextFiles);
              toast.success(`Uploaded ${uploadedFile.fileName}`);
            } catch (mappingError) {
              const message =
                mappingError instanceof Error
                  ? mappingError.message
                  : PASCO_UPLOAD_REJECTED_MESSAGE;
              showUploadError(message);
            }
          },
        );
      }
    },
    [finishOpening, onFilesChange],
  );

  const openUploadWidget = useCallback(async () => {
    if (isOpeningRef.current || isWidgetOpen) {
      return;
    }

    if (!courseId) {
      showUploadError("Select a course before uploading files.");
      return;
    }

    if (!isScriptReady || !window.cloudinary?.createUploadWidget) {
      showUploadError("Cloudinary Upload Widget is still loading.");
      return;
    }

    const remainingSlots = maxFiles - filesRef.current.length;

    if (remainingSlots <= 0) {
      showUploadError(`You can upload up to ${maxFiles} files.`);
      return;
    }

    isOpeningRef.current = true;
    setIsOpening(true);
    batchContentHashesRef.current.clear();
    uploadSuccessQueueRef.current = Promise.resolve();

    try {
      const bootstrapSign = await signCloudinaryUpload({
        courseId,
        resourceType: "IMAGE",
        fileName: "bootstrap.pdf",
      });

      widgetRef.current?.destroy();

      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: bootstrapSign.cloudName,
          uploadPreset: bootstrapSign.uploadPreset,
          assetFolder: bootstrapSign.assetFolder,
          sources: ["local"],
          multiple: true,
          maxFiles: remainingSlots,
          maxFileSize: PASCO_MAX_FILE_SIZE_BYTES,
          clientAllowedFormats: PASCO_WIDGET_ALLOWED_FORMATS,
          showAdvancedOptions: false,
          showPoweredBy: false,
          preBatch: (
            callback: (result?: CloudinaryPreBatchCallbackResult) => void,
            data: CloudinaryPreBatchData,
          ) => {
            try {
              const batchFiles = data.files ?? [];
              const singularFile =
                "file" in (data as object)
                  ? (data as { file?: { name?: string } }).file
                  : undefined;
              const preBatchCandidates =
                batchFiles.length > 0
                  ? batchFiles
                  : singularFile
                    ? [singularFile]
                    : [];
              preBatchFileNamesRef.current = preBatchCandidates
                .map((file) => readPreBatchFileName(file))
                .filter(
                  (name): name is string =>
                    typeof name === "string" && isAllowedPascoFileName(name),
                );
              const invalidFile = preBatchCandidates.find((file) => {
                const fileName = readPreBatchFileName(file);

                return !fileName || !isAllowedPascoFileName(fileName);
              });

              if (invalidFile) {
                rejectPreBatchUpload(callback, PASCO_UPLOAD_REJECTED_MESSAGE);
                return;
              }

              const tooLargeFile = preBatchCandidates.find((file) => {
                const size = getPreBatchFileSize(file);

                return (
                  typeof size === "number" && size > PASCO_MAX_FILE_SIZE_BYTES
                );
              });

              if (tooLargeFile) {
                rejectPreBatchUpload(
                  callback,
                  getPascoFileTooLargeMessage(PASCO_MAX_FILE_SIZE_BYTES),
                );
                return;
              }

              callback();
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Could not validate selected files.";
              rejectPreBatchUpload(callback, message);
            }
          },
          prepareUploadParams: (
            callback: (
              prepared:
                | Record<string, unknown>
                | Record<string, unknown>[]
                | { cancel: true; error?: string },
            ) => void,
            params:
              | CloudinaryPrepareUploadParams
              | CloudinaryPrepareUploadParams[],
          ) => {
            const requests = Array.isArray(params) ? params : [params];

            Promise.all(
              requests.map(async (request) => {
                let fileName = resolvePrepareUploadFileName(request);
                if (!fileName && preBatchFileNamesRef.current.length > 0) {
                  fileName = preBatchFileNamesRef.current.shift() ?? null;
                }

                if (!fileName || !isAllowedPascoFileName(fileName)) {
                  throw new Error(PASCO_UPLOAD_REJECTED_MESSAGE);
                }

                const signed = await signCloudinaryUpload({
                  courseId: courseIdRef.current,
                  resourceType: inferResourceType(fileName),
                  fileName,
                  widgetParams: extractWidgetSignParams(request) ?? undefined,
                });

                return {
                  signature: signed.signature,
                  apiKey: signed.apiKey,
                  uploadSignatureTimestamp: signed.timestamp,
                  uploadPreset: signed.uploadPreset,
                  resourceType: signed.resourceType === "RAW" ? "raw" : "image",
                  asset_folder: signed.assetFolder,
                };
              }),
            )
              .then((results) => {
                callback(results.length === 1 ? results[0] : results);
              })
              .catch((prepareError: unknown) => {
                const message =
                  prepareError instanceof Error
                    ? prepareError.message
                    : "Could not prepare upload";
                rejectPrepareUpload(callback, message);
              });
          },
        },
        handleWidgetResult,
      );

      widgetRef.current = widget;
      widget.open();
      startOpeningFallbackTimer();
    } catch (error) {
      finishOpening();
      const message =
        error instanceof Error ? error.message : "Could not open upload widget";
      showUploadError(message);
    }
  }, [
    courseId,
    finishOpening,
    handleWidgetResult,
    isScriptReady,
    isWidgetOpen,
    maxFiles,
    startOpeningFallbackTimer,
  ]);

  const uploadDisabled =
    disabled || !courseId || isOpening || isWidgetOpen || !isScriptReady;

  function removeFile(order: number) {
    onFilesChange(files.filter((file) => file.order !== order));
  }

  return (
    <Field data-invalid={!!filesError}>
      <FieldLabel>Files</FieldLabel>
      <FieldDescription>
        {PASCO_UPLOAD_ACCEPT_DESCRIPTION} Max {maxFiles} files,{" "}
        {Math.floor(PASCO_MAX_FILE_SIZE_BYTES / 1_048_576)} MB each. Select a
        course first.
      </FieldDescription>

      <Alert>
        <AlertDescription>
          Do not upload password-protected PDFs. They cannot be processed and
          may fail to upload.
        </AlertDescription>
      </Alert>

      <Button
        type="button"
        variant="outline"
        onClick={openUploadWidget}
        disabled={uploadDisabled}
      >
        {isOpening ? (
          <>
            <Spinner />
            Opening uploader…
          </>
        ) : (
          "Upload files"
        )}
      </Button>

      {uploadIssue && (
        <Alert variant="destructive">
          <AlertDescription>
            {uploadIssue.message}
            {uploadIssue.pascoId ? (
              <>
                {" "}
                <Link
                  href={`/pascos/${uploadIssue.pascoId}`}
                  className="font-medium underline underline-offset-3"
                >
                  View existing pasco
                  {uploadIssue.fileName ? ` (${uploadIssue.fileName})` : ""}
                </Link>
              </>
            ) : null}
          </AlertDescription>
          <AlertAction>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setUploadIssue(null)}
              aria-label="Dismiss upload issue"
            >
              <X />
            </Button>
          </AlertAction>
        </Alert>
      )}

      {filesError && <FieldError errors={[filesError]} />}

      {files.length > 0 && (
        <ul className="space-y-2 pt-2">
          {files.map((file) => (
            <li
              key={`${file.publicId}-${file.order}`}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="min-w-0">
                <span className="block truncate">
                  {file.order}. {file.fileName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.fileSize)}
                </span>
              </span>
              <Button
                type="button"
                variant="destructive"
                size="icon-xs"
                onClick={() => removeFile(file.order)}
                disabled={disabled}
                aria-label={`Remove ${file.fileName}`}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
}
