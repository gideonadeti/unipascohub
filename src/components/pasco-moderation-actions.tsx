"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useModeratePascoReview } from "@/hooks/api/use-moderation";

type PascoModerationActionsProps = {
  pascoId: string;
  compact?: boolean;
};

export function PascoModerationActions({
  pascoId,
  compact = false,
}: PascoModerationActionsProps) {
  const moderateMutation = useModeratePascoReview();

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
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        variant="destructive"
        disabled={moderateMutation.isPending}
        onClick={() => moderateMutation.mutate({ pascoId, action: "reject" })}
      >
        Reject
      </Button>
    </div>
  );
}
