"use client";

import { CatalogSubmissionRejectDialog } from "@/components/catalog-submission-reject-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useModerateCatalogSubmissionReview } from "@/hooks/api/use-catalog-submissions";
import type { CatalogSubmissionStatus } from "@/types/api/catalog-submissions";

type CatalogSubmissionModerationActionsProps = {
  submissionId: string;
  status?: CatalogSubmissionStatus;
  compact?: boolean;
};

export function CatalogSubmissionModerationActions({
  submissionId,
  status = "PENDING",
  compact = false,
}: CatalogSubmissionModerationActionsProps) {
  const moderateMutation = useModerateCatalogSubmissionReview();

  if (status !== "PENDING") {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        disabled={moderateMutation.isPending}
        onClick={() =>
          moderateMutation.mutate({ submissionId, action: "approve" })
        }
      >
        {moderateMutation.isPending ? <Spinner aria-hidden /> : null}
        Approve
      </Button>
      <CatalogSubmissionRejectDialog
        submissionId={submissionId}
        compact={compact}
      />
    </div>
  );
}
