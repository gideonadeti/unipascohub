"use client";

import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateCatalogSubmission } from "@/hooks/api/use-catalog-submissions";
import { formatEnumLabel } from "@/lib/catalog-labels";
import type { ProgramType } from "@/types/api/catalog";
import type { CatalogSubmission } from "@/types/api/catalog-submissions";

const PROGRAM_TYPE_OPTIONS: ProgramType[] = [
  "BACHELOR",
  "BTECH",
  "BTECH_TOP_UP",
  "HND",
  "DIPLOMA",
];

type CatalogSubmissionEditDialogProps = {
  submission: CatalogSubmission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CatalogSubmissionEditDialog({
  submission,
  open,
  onOpenChange,
}: CatalogSubmissionEditDialogProps) {
  const [programName, setProgramName] = useState(submission.programName ?? "");
  const [programType, setProgramType] = useState<ProgramType>(
    (submission.programType as ProgramType) ?? "BACHELOR",
  );
  const [courseCode, setCourseCode] = useState(submission.courseCode ?? "");
  const [courseTitle, setCourseTitle] = useState(submission.courseTitle ?? "");
  const isProgram = submission.type === "PROGRAM";
  const updateSubmission = useUpdateCatalogSubmission();

  function handleSubmit() {
    const payload:
      | { programName: string; programType: ProgramType }
      | { courseCode: string; courseTitle: string } =
      submission.type === "PROGRAM"
        ? {
            programName: programName.trim(),
            programType,
          }
        : {
            courseCode: courseCode.trim().toUpperCase(),
            courseTitle: courseTitle.trim(),
          };

    updateSubmission.mutate(
      {
        submissionId: submission.id,
        ...payload,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Edit {isProgram ? "program" : "course"} request
          </DialogTitle>
          <DialogDescription>
            Make changes to your submission and resubmit for review.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Alert
            variant="default"
            className="border-amber-500/50 bg-amber-50 text-amber-900"
          >
            <AlertDescription>
              This submission was previously rejected. Saving will resubmit it
              for moderator review.
            </AlertDescription>
          </Alert>

          {isProgram ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-program-name">Program name</Label>
                <Input
                  id="edit-program-name"
                  value={programName}
                  onChange={(event) => setProgramName(event.target.value)}
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-program-type">Program type</Label>
                <Select
                  value={programType}
                  onValueChange={(value) =>
                    setProgramType(value as ProgramType)
                  }
                >
                  <SelectTrigger id="edit-program-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAM_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatEnumLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-course-code">Course code</Label>
                <Input
                  id="edit-course-code"
                  value={courseCode}
                  onChange={(event) => setCourseCode(event.target.value)}
                  placeholder="e.g. DCIT 101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-course-title">Course title</Label>
                <Input
                  id="edit-course-title"
                  value={courseTitle}
                  onChange={(event) => setCourseTitle(event.target.value)}
                  placeholder="e.g. Introduction to Programming"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateSubmission.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={
              updateSubmission.isPending ||
              (isProgram
                ? !programName.trim()
                : !courseCode.trim() || !courseTitle.trim())
            }
            onClick={handleSubmit}
          >
            {updateSubmission.isPending ? <Spinner aria-hidden /> : null}
            Save & resubmit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
