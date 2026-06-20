"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useModerateCatalogSubmissionReview } from "@/hooks/api/use-catalog-submissions";

type CatalogSubmissionRejectDialogProps = {
  submissionId: string;
  compact?: boolean;
};

export function CatalogSubmissionRejectDialog({
  submissionId,
  compact = false,
}: CatalogSubmissionRejectDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const moderateMutation = useModerateCatalogSubmissionReview();

  function handleReject() {
    const trimmed = reason.trim();

    if (!trimmed) {
      return;
    }

    moderateMutation.mutate(
      { submissionId, action: "reject", reason: trimmed },
      {
        onSuccess: () => {
          setReason("");
          setOpen(false);
        },
      },
    );
  }

  return (
    <>
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        variant="destructive"
        onClick={() => setOpen(true)}
      >
        Reject
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject catalog submission</DialogTitle>
            <DialogDescription>
              Provide a reason the contributor will see. They can submit a
              corrected request later.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain why this request was rejected…"
            rows={4}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={moderateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={moderateMutation.isPending || !reason.trim()}
              onClick={handleReject}
            >
              {moderateMutation.isPending ? <Spinner aria-hidden /> : null}
              Reject submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
