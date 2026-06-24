"use client";

import { Flag } from "lucide-react";
import { useState } from "react";

import { FeedbackDialog } from "@/components/feedback-dialog";
import { Button } from "@/components/ui/button";

type ReportPascoLinkProps = {
  pascoId: string;
};

export function ReportPascoLink({ pascoId }: ReportPascoLinkProps) {
  const [open, setOpen] = useState(false);
  const pageUrl =
    typeof window !== "undefined"
      ? (window.location.href.split("#")[0] ?? "")
      : "";

  return (
    <>
      <FeedbackDialog
        pascoId={pascoId}
        pageUrl={pageUrl || `/pascos/${pascoId}`}
        open={open}
        onOpenChange={setOpen}
      />
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Flag className="size-4" aria-hidden />
        Report
      </Button>
    </>
  );
}
