"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

import {
  Dialog,
  DialogContentInOverlay,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { getPascoFileViewKind } from "@/lib/pasco-file-types";
import type { PascoFile } from "@/types/api/pascos";

const PascoEmbedPdfViewer = dynamic(
  () =>
    import("@/components/pasco-embed-pdf-viewer").then(
      (module) => module.PascoEmbedPdfViewer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center" aria-busy="true">
        <Spinner aria-hidden />
        <span className="sr-only">Loading PDF viewer…</span>
      </div>
    ),
  },
);

type PascoFileViewProps = {
  file: PascoFile | null;
  onClose: () => void;
};

export function PascoFileView({ file, onClose }: PascoFileViewProps) {
  const viewKind = file ? getPascoFileViewKind(file.fileName) : null;
  const isOpen = file !== null && viewKind !== "download-only";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContentInOverlay
        className="flex h-[90vh] max-w-6xl flex-col gap-0 overflow-hidden p-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-none sm:max-w-6xl"
        showCloseButton
      >
        {file ? (
          <>
            <DialogHeader className="shrink-0 border-b px-4 py-3 pr-12">
              <DialogTitle className="truncate text-base">
                {file.fileName}
              </DialogTitle>
              <DialogDescription className="sr-only">
                File preview
              </DialogDescription>
            </DialogHeader>
            <div
              className="h-[calc(90vh-3.5rem)] min-h-0 bg-muted/30"
              onWheel={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
            >
              {viewKind === "pdf" ? (
                <PascoEmbedPdfViewer
                  key={file.fileUrl}
                  fileUrl={file.fileUrl}
                />
              ) : null}
              {viewKind === "image" ? (
                <div className="relative h-full p-4">
                  <Image
                    src={file.fileUrl}
                    alt={file.fileName}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 72rem"
                  />
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContentInOverlay>
    </Dialog>
  );
}
