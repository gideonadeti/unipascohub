"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useRecordPascoFileDownload } from "@/hooks/api/use-pasco-engagement";
import type { PascoFile } from "@/types/api/pascos";

type PascoFileDownloadProps = {
  pascoId: string;
  file: PascoFile;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1_048_576) {
    return `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;
  }

  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export function PascoFileDownload({ pascoId, file }: PascoFileDownloadProps) {
  const { isSignedIn } = useAuth();
  const downloadMutation = useRecordPascoFileDownload(pascoId);

  async function handleDownload() {
    const result = await downloadMutation.mutateAsync(file.id);
    window.open(result.fileUrl, "_blank", "noopener,noreferrer");
  }

  const label = `${file.order}. ${file.fileName} (${formatFileSize(file.fileSize)})`;

  if (isSignedIn !== true) {
    return (
      <SignInButton mode="modal">
        <Button
          type="button"
          variant="link"
          className="h-auto justify-start px-0 text-left"
        >
          <Download className="size-4 shrink-0" aria-hidden />
          <span>{label}</span>
        </Button>
      </SignInButton>
    );
  }

  return (
    <Button
      type="button"
      variant="link"
      className="h-auto justify-start px-0 text-left"
      disabled={downloadMutation.isPending}
      onClick={() => void handleDownload()}
    >
      {downloadMutation.isPending ? (
        <Spinner />
      ) : (
        <Download className="size-4 shrink-0" aria-hidden />
      )}
      <span>{label}</span>
    </Button>
  );
}
