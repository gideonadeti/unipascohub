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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useCreateCatalogSubmission } from "@/hooks/api/use-catalog-submissions";
import { formatEnumLabel } from "@/lib/catalog-labels";
import type { ProgramType } from "@/types/api/catalog";

const PROGRAM_TYPE_OPTIONS: ProgramType[] = [
  "BACHELOR",
  "BTECH",
  "BTECH_TOP_UP",
  "HND",
  "DIPLOMA",
];

type CatalogProgramRequestDialogProps = {
  institutionId: string;
  disabled?: boolean;
};

export function CatalogProgramRequestDialog({
  institutionId,
  disabled = false,
}: CatalogProgramRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [programName, setProgramName] = useState("");
  const [programType, setProgramType] = useState<ProgramType>("BACHELOR");
  const createSubmission = useCreateCatalogSubmission();

  function handleSubmit() {
    const trimmedName = programName.trim();

    if (!trimmedName) {
      return;
    }

    createSubmission.mutate(
      {
        type: "PROGRAM",
        institutionId,
        programName: trimmedName,
        programType,
      },
      {
        onSuccess: () => {
          setProgramName("");
          setProgramType("BACHELOR");
          setOpen(false);
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
          disabled={disabled || !institutionId}
        >
          Request a program
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a program</DialogTitle>
          <DialogDescription>
            Submit a program for moderator review. Once approved, it will appear
            in the program list for this institution.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="catalog-program-name">Program name</Label>
            <Input
              id="catalog-program-name"
              value={programName}
              onChange={(event) => setProgramName(event.target.value)}
              placeholder="e.g. Computer Science"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="catalog-program-type">Program type</Label>
            <Select
              value={programType}
              onValueChange={(value) => setProgramType(value as ProgramType)}
            >
              <SelectTrigger id="catalog-program-type" className="w-full">
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
            disabled={createSubmission.isPending || !programName.trim()}
            onClick={handleSubmit}
          >
            {createSubmission.isPending ? <Spinner aria-hidden /> : null}
            Submit for review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
