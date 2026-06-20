"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useRecordPascoFileDownload } from "@/hooks/api/use-pasco-engagement";
import type { PascoFile } from "@/types/api/pascos";

const COMPACT_BUTTON_CLASS =
  "min-h-11 w-full gap-1.5 sm:min-h-8 sm:w-auto sm:min-w-8 sm:px-3 sm:gap-1";

type PascoFileDownloadProps = {
  pascoId: string;
  file: PascoFile;
  compact?: boolean;
};

export function PascoFileDownload({
  pascoId,
  file,
  compact = false,
}: PascoFileDownloadProps) {
  const { isSignedIn } = useAuth();
  const downloadMutation = useRecordPascoFileDownload(pascoId);
  const ariaLabel = `Download ${file.fileName}`;

  async function handleDownload() {
    const result = await downloadMutation.mutateAsync(file.id);
    window.open(result.fileUrl, "_blank", "noopener,noreferrer");
  }

  const buttonProps = {
    type: "button" as const,
    variant: "outline" as const,
    size: compact ? ("icon-sm" as const) : ("sm" as const),
    className: compact ? COMPACT_BUTTON_CLASS : undefined,
    "aria-label": compact ? ariaLabel : undefined,
  };

  const content = downloadMutation.isPending ? (
    <Spinner aria-hidden />
  ) : (
    <>
      <Download className="size-4" aria-hidden />
      {compact ? <span>Download</span> : "Download"}
    </>
  );

  if (isSignedIn !== true) {
    return (
      <SignInButton mode="modal">
        <Button {...buttonProps}>{content}</Button>
      </SignInButton>
    );
  }

  return (
    <Button
      {...buttonProps}
      disabled={downloadMutation.isPending}
      onClick={() => void handleDownload()}
    >
      {content}
    </Button>
  );
}
