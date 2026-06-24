"use client";

import type { MouseEvent } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteCatalogSubmission } from "@/hooks/api/use-catalog-submissions";
import { cn } from "@/lib/utils";

type CatalogSubmissionDeleteDialogProps = {
  submissionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CatalogSubmissionDeleteDialog({
  submissionId,
  open,
  onOpenChange,
}: CatalogSubmissionDeleteDialogProps) {
  const deleteSubmission = useDeleteCatalogSubmission();

  function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    deleteSubmission.mutate(submissionId, {
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete catalog request?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The catalog request will be
            permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteSubmission.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }))}
            disabled={deleteSubmission.isPending}
            onClick={handleDelete}
          >
            {deleteSubmission.isPending ? (
              <>
                <Spinner aria-hidden />
                Deleting…
              </>
            ) : (
              "Delete request"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
