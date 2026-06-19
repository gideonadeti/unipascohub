"use client";

import { PascoRejectDialog } from "@/components/pasco-reject-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useModeratePascoReview } from "@/hooks/api/use-moderation";
import type { PascoModerationStatus } from "@/types/api/pascos";

type PascoModerationActionsProps = {
  pascoId: string;
  status?: PascoModerationStatus;
  compact?: boolean;
};

export function PascoModerationActions({
  pascoId,
  status = "PENDING_REVIEW",
  compact = false,
}: PascoModerationActionsProps) {
  const moderateMutation = useModeratePascoReview();

  if (status === "REJECTED") {
    return (
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        disabled={moderateMutation.isPending}
        onClick={() => moderateMutation.mutate({ pascoId, action: "restore" })}
      >
        {moderateMutation.isPending ? <Spinner aria-hidden /> : null}
        Restore
      </Button>
    );
  }

  if (status === "PUBLISHED") {
    return (
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        variant="outline"
        disabled={moderateMutation.isPending}
        onClick={() => moderateMutation.mutate({ pascoId, action: "flag" })}
      >
        {moderateMutation.isPending ? <Spinner aria-hidden /> : null}
        Send to review
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        disabled={moderateMutation.isPending}
        onClick={() => moderateMutation.mutate({ pascoId, action: "approve" })}
      >
        {moderateMutation.isPending ? <Spinner aria-hidden /> : null}
        Approve
      </Button>
      <PascoRejectDialog pascoId={pascoId} compact={compact} />
    </div>
  );
}
