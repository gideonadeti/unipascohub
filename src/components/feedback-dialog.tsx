"use client";
import { FeedbackForm } from "@/components/feedback-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FeedbackDialogProps = {
  pascoId: string;
  pageUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FeedbackDialog({
  pascoId,
  pageUrl,
  open,
  onOpenChange,
}: FeedbackDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report issue with this pasco</DialogTitle>
          <DialogDescription>
            Let us know what's wrong so we can fix it.
          </DialogDescription>
        </DialogHeader>
        <FeedbackForm
          initialValues={{ category: "CONTENT_ISSUE", pascoId, pageUrl }}
          showCategorySelector={false}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
