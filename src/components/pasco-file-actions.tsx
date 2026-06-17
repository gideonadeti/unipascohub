"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { Eye } from "lucide-react";

import { PascoFileDownload } from "@/components/pasco-file-download";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { usePascoFileViewUrl } from "@/hooks/api/use-pasco-engagement";
import { formatPascoFileSize } from "@/lib/pasco-file-format";
import { getPascoFileViewKind } from "@/lib/pasco-file-types";
import type { PascoFile } from "@/types/api/pascos";

type PascoFileActionsProps = {
  pascoId: string;
  file: PascoFile;
  onView: (file: PascoFile) => void;
};

export function PascoFileActions({
  pascoId,
  file,
  onView,
}: PascoFileActionsProps) {
  const { isSignedIn } = useAuth();
  const viewUrlMutation = usePascoFileViewUrl(pascoId);
  const viewKind = getPascoFileViewKind(file.fileName);
  const canView = viewKind !== "download-only";
  const label = `${file.order}. ${file.fileName} (${formatPascoFileSize(file.fileSize)})`;

  async function handleView() {
    const result = await viewUrlMutation.mutateAsync(file.id);
    onView({
      ...file,
      fileUrl: result.fileUrl,
      fileName: result.fileName,
    });
  }

  function renderViewButton() {
    if (!canView) {
      return null;
    }

    if (isSignedIn !== true) {
      return (
        <SignInButton mode="modal">
          <Button type="button" variant="outline" size="sm">
            <Eye className="size-4" aria-hidden />
            View
          </Button>
        </SignInButton>
      );
    }

    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={viewUrlMutation.isPending}
        onClick={() => void handleView()}
      >
        {viewUrlMutation.isPending ? (
          <Spinner aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
        View
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {renderViewButton()}
      <PascoFileDownload pascoId={pascoId} file={file} />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
