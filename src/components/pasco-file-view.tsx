"use client";

import { ExternalLink } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContentInOverlay,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { getPascoFileViewKind } from "@/lib/pasco-file-types";
import { cn } from "@/lib/utils";
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
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-none",
          "h-dvh max-h-dvh w-full max-w-full rounded-none sm:h-[90vh] sm:max-h-[90vh] sm:max-w-6xl sm:rounded-2xl",
        )}
        showCloseButton
      >
        {file ? (
          <>
            <DialogHeader className="shrink-0 border-b px-4 py-3 pr-12 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <DialogTitle className="truncate text-base">
                {file.fileName}
              </DialogTitle>
              <DialogDescription className="sr-only">
                File preview
              </DialogDescription>
            </DialogHeader>
            <div
              className="min-h-0 flex-1 bg-muted/30 sm:h-[calc(90vh-3.5rem)]"
              onWheel={(event) => event.stopPropagation()}
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
            {viewKind === "pdf" ? (
              <DialogFooter className="shrink-0 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  asChild
                >
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-4" aria-hidden />
                    Open in new tab
                  </a>
                </Button>
              </DialogFooter>
            ) : null}
          </>
        ) : null}
      </DialogContentInOverlay>
    </Dialog>
  );
}
