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
import { useModeratePascoReview } from "@/hooks/api/use-moderation";

type PascoRejectDialogProps = {
  pascoId: string;
  compact?: boolean;
};

export function PascoRejectDialog({
  pascoId,
  compact = false,
}: PascoRejectDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const moderateMutation = useModeratePascoReview();

  function handleReject() {
    const trimmed = reason.trim();

    if (!trimmed) {
      return;
    }

    moderateMutation.mutate(
      { pascoId, action: "reject", reason: trimmed },
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject pasco</DialogTitle>
            <DialogDescription>
              Provide a reason the uploader will see. This pasco stays hidden
              from other students.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain why this pasco was rejected…"
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
              Reject pasco
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
