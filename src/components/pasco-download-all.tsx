"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useDownloadPascoAll } from "@/hooks/api/use-pasco-engagement";
import { formatPascoFileSize } from "@/lib/pasco-file-format";
import type { Course } from "@/types/api/catalog";
import type { PascoFile } from "@/types/api/pascos";

type PascoDownloadAllProps = {
  pascoId: string;
  files: PascoFile[];
  course?: Pick<Course, "code"> | null;
};

function getTotalFileSize(files: PascoFile[]): number {
  return files.reduce((total, file) => total + file.fileSize, 0);
}

export function PascoDownloadAll({
  pascoId,
  files,
  course,
}: PascoDownloadAllProps) {
  const { isSignedIn } = useAuth();
  const downloadAllMutation = useDownloadPascoAll(pascoId, course?.code);
  const totalSize = formatPascoFileSize(getTotalFileSize(files));
  const ariaLabel = course
    ? `Download all files for ${course.code} as ZIP (${totalSize})`
    : `Download all files as ZIP (${totalSize})`;

  async function handleDownloadAll() {
    const result = await downloadAllMutation.mutateAsync();
    const objectUrl = URL.createObjectURL(result.blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = result.fileName;
    link.rel = "noopener";
    link.click();
    URL.revokeObjectURL(objectUrl);
  }

  const buttonContent = downloadAllMutation.isPending ? (
    <>
      <Spinner aria-hidden />
      <span>Preparing download…</span>
    </>
  ) : (
    <>
      <Download className="size-4" aria-hidden />
      <span>Download all</span>
      <span className="text-muted-foreground">({totalSize})</span>
    </>
  );

  if (isSignedIn !== true) {
    return (
      <SignInButton mode="modal">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          aria-label={ariaLabel}
        >
          <Download className="size-4" aria-hidden />
          <span>Download all</span>
          <span className="text-muted-foreground">({totalSize})</span>
        </Button>
      </SignInButton>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full sm:w-auto"
      aria-label={ariaLabel}
      disabled={downloadAllMutation.isPending}
      onClick={() => void handleDownloadAll()}
    >
      {buttonContent}
    </Button>
  );
}
