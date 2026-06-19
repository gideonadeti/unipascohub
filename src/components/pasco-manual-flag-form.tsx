"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useModeratePascoReview } from "@/hooks/api/use-moderation";

export function PascoManualFlagForm() {
  const [pascoId, setPascoId] = useState("");
  const [note, setNote] = useState("");
  const moderateMutation = useModeratePascoReview();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedId = pascoId.trim();

    if (!trimmedId) {
      return;
    }

    moderateMutation.mutate(
      {
        pascoId: trimmedId,
        action: "flag",
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          setPascoId("");
          setNote("");
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border p-4"
    >
      <div className="space-y-1">
        <h2 className="text-sm font-medium">Manual review</h2>
        <p className="text-sm text-muted-foreground">
          Send a pasco to the review queue by ID (for example after a report
          email).
        </p>
      </div>
      <Input
        value={pascoId}
        onChange={(event) => setPascoId(event.target.value)}
        placeholder="Pasco ID"
        aria-label="Pasco ID"
      />
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional note for moderators"
        rows={2}
      />
      <Button
        type="submit"
        disabled={moderateMutation.isPending || !pascoId.trim()}
      >
        {moderateMutation.isPending ? <Spinner aria-hidden /> : null}
        Send to review
      </Button>
    </form>
  );
}
