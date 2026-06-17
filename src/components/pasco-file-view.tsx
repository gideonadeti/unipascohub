"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

import {
  Dialog,
  DialogContent,
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
      <div className="flex h-full items-center justify-center">
        <Spinner />
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
      <DialogContent
        className="flex h-[90vh] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl"
        showCloseButton
      >
        {file ? (
          <>
            <DialogHeader className="shrink-0 border-b px-4 py-3 pr-12">
              <DialogTitle className="truncate text-base">
                {file.fileName}
              </DialogTitle>
            </DialogHeader>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/30">
              {viewKind === "pdf" ? (
                <div className="h-full min-h-0 flex-1">
                  <PascoEmbedPdfViewer fileUrl={file.fileUrl} />
                </div>
              ) : null}
              {viewKind === "image" ? (
                <div className="relative min-h-0 flex-1 p-4">
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
      </DialogContent>
    </Dialog>
  );
}
