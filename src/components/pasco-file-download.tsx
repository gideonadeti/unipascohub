"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useRecordPascoFileDownload } from "@/hooks/api/use-pasco-engagement";
import { formatPascoFileSize } from "@/lib/pasco-file-format";
import type { PascoFile } from "@/types/api/pascos";

type PascoFileDownloadProps = {
  pascoId: string;
  file: PascoFile;
  showLabel?: boolean;
};

export function PascoFileDownload({
  pascoId,
  file,
  showLabel = false,
}: PascoFileDownloadProps) {
  const { isSignedIn } = useAuth();
  const downloadMutation = useRecordPascoFileDownload(pascoId);

  async function handleDownload() {
    const result = await downloadMutation.mutateAsync(file.id);
    window.open(result.fileUrl, "_blank", "noopener,noreferrer");
  }

  const label = `${file.order}. ${file.fileName} (${formatPascoFileSize(file.fileSize)})`;

  if (isSignedIn !== true) {
    return (
      <SignInButton mode="modal">
        <Button type="button" variant="outline" size="sm">
          <Download className="size-4" aria-hidden />
          {showLabel ? label : "Download"}
        </Button>
      </SignInButton>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={downloadMutation.isPending}
      onClick={() => void handleDownload()}
    >
      {downloadMutation.isPending ? (
        <Spinner aria-hidden />
      ) : (
        <Download className="size-4" aria-hidden />
      )}
      {showLabel ? label : "Download"}
    </Button>
  );
}
