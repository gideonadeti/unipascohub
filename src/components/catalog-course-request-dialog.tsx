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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useCreateCatalogSubmission } from "@/hooks/api/use-catalog-submissions";

type CatalogCourseRequestDialogProps = {
  institutionId: string;
  programId: string;
  disabled?: boolean;
  onCourseAdded?: (courseId: string) => void;
};

export function CatalogCourseRequestDialog({
  institutionId,
  programId,
  disabled = false,
  onCourseAdded,
}: CatalogCourseRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const createSubmission = useCreateCatalogSubmission();

  function handleSubmit() {
    const trimmedCode = courseCode.trim();
    const trimmedTitle = courseTitle.trim();

    if (!trimmedCode || !trimmedTitle) {
      return;
    }

    createSubmission.mutate(
      {
        type: "COURSE",
        institutionId,
        courseCode: trimmedCode,
        courseTitle: trimmedTitle,
        programIds: [programId],
      },
      {
        onSuccess: (data) => {
          setCourseCode("");
          setCourseTitle("");
          setOpen(false);

          if (
            data.submission.status === "APPROVED" &&
            data.submission.approvedCourseId
          ) {
            onCourseAdded?.(data.submission.approvedCourseId);
          }
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="link"
          className="h-auto px-0 text-sm"
          disabled={disabled || !institutionId || !programId}
        >
          Add a course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a course</DialogTitle>
          <DialogDescription>
            Add a course to the catalog for the selected program. It will be
            available immediately so you can continue uploading.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="catalog-course-code">Course code</Label>
            <Input
              id="catalog-course-code"
              value={courseCode}
              onChange={(event) => setCourseCode(event.target.value)}
              placeholder="e.g. DCIT 101"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="catalog-course-title">Course title</Label>
            <Input
              id="catalog-course-title"
              value={courseTitle}
              onChange={(event) => setCourseTitle(event.target.value)}
              placeholder="e.g. Introduction to Programming"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={createSubmission.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={
              createSubmission.isPending ||
              !courseCode.trim() ||
              !courseTitle.trim()
            }
            onClick={handleSubmit}
          >
            {createSubmission.isPending ? <Spinner aria-hidden /> : null}
            Add course
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
