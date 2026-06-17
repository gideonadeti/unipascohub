"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useDeletePasco } from "@/hooks/api/use-pascos";
import { getPascoDeleteErrorMessage } from "@/lib/pasco-duplicate-error";

type PascoDeleteDialogProps = {
  pascoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PascoDeleteDialog({
  pascoId,
  open,
  onOpenChange,
}: PascoDeleteDialogProps) {
  const deletePasco = useDeletePasco(pascoId);

  useEffect(() => {
    if (!deletePasco.error) {
      return;
    }

    toast.error(getPascoDeleteErrorMessage(deletePasco.error));
  }, [deletePasco.error]);

  function handleDelete() {
    deletePasco.mutate();
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete pasco?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The pasco and all of its files will be
            permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletePasco.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={deletePasco.isPending}
            onClick={handleDelete}
          >
            {deletePasco.isPending ? (
              <>
                <Spinner />
                Deleting…
              </>
            ) : (
              "Delete pasco"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
