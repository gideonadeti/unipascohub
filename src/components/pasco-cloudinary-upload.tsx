"use client";

import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
  signCloudinaryUpload,
} from "@/lib/api/cloudinary";
import {
  isAllowedPascoFileName,
  PASCO_UPLOAD_ACCEPT_DESCRIPTION,
  PASCO_UPLOAD_REJECTED_MESSAGE,
  PASCO_WIDGET_ALLOWED_FORMATS,
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

type PascoCloudinaryUploadProps = {
  courseId: string;
  files: PascoFileCreateInput[];
  filesError?: { message?: string };
  disabled?: boolean;
  onFilesChange: (files: PascoFileCreateInput[]) => void;
};

function showUploadError(message: string) {
  toast.error(message);
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
  onFilesChange,
}: PascoCloudinaryUploadProps) {
  const widgetRef = useRef<CloudinaryUploadWidget | null>(null);
  const filesRef = useRef(files);
  const courseIdRef = useRef(courseId);
  const preBatchFileNamesRef = useRef<string[]>([]);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  filesRef.current = files;
  courseIdRef.current = courseId;

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
        showUploadError(
          error instanceof Error ? error.message : "Cloudinary upload failed",
        );
        return;
      }

      if (result.event === "success" && result.info) {
        try {
          const currentFiles = filesRef.current;
          const nextOrder =
            currentFiles.length > 0
              ? Math.max(...currentFiles.map((file) => file.order)) + 1
              : 1;

          const uploadedFile = cloudinaryUploadInfoToPascoFile(
            result.info,
            nextOrder,
          );

          onFilesChange([...currentFiles, uploadedFile]);
          toast.success(`Uploaded ${uploadedFile.fileName}`);
        } catch (mappingError) {
          const message =
            mappingError instanceof Error
              ? mappingError.message
              : PASCO_UPLOAD_REJECTED_MESSAGE;
          showUploadError(message);
        }
      }
    },
    [onFilesChange],
  );

  const openUploadWidget = useCallback(async () => {
    if (!courseId) {
      showUploadError("Select a course before uploading files.");
      return;
    }

    if (!isScriptReady || !window.cloudinary?.createUploadWidget) {
      showUploadError("Cloudinary Upload Widget is still loading.");
      return;
    }

    const remainingSlots = PASCO_MAX_FILES - filesRef.current.length;

    if (remainingSlots <= 0) {
      showUploadError(`You can upload up to ${PASCO_MAX_FILES} files.`);
      return;
    }

    setIsOpening(true);

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
              .map((file) => file?.name)
              .filter(
                (name): name is string =>
                  typeof name === "string" && isAllowedPascoFileName(name),
              );
            const invalidFile = preBatchCandidates.find(
              (file) => !file?.name || !isAllowedPascoFileName(file.name),
            );

            if (invalidFile) {
              rejectPreBatchUpload(callback, PASCO_UPLOAD_REJECTED_MESSAGE);
              return;
            }

            callback();
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not open upload widget";
      showUploadError(message);
    } finally {
      setIsOpening(false);
    }
  }, [courseId, handleWidgetResult, isScriptReady]);

  function removeFile(order: number) {
    onFilesChange(files.filter((file) => file.order !== order));
  }

  const uploadDisabled = disabled || !courseId || isOpening || !isScriptReady;

  return (
    <Field data-invalid={!!filesError}>
      <FieldLabel>Files</FieldLabel>
      <FieldDescription>
        {PASCO_UPLOAD_ACCEPT_DESCRIPTION} Max {PASCO_MAX_FILES} files,{" "}
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
