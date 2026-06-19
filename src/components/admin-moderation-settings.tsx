"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  useModerationSettings,
  useUpdateModerationSettings,
} from "@/hooks/api/use-moderation";

export function AdminModerationSettings() {
  const settingsQuery = useModerationSettings();
  const updateMutation = useUpdateModerationSettings();
  const [threshold, setThreshold] = useState<string>("");

  const currentThreshold =
    threshold || settingsQuery.data?.dislikeThreshold.toString() || "";

  if (settingsQuery.isPending) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading moderation settings…
      </p>
    );
  }

  if (settingsQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        Could not load moderation settings.
      </p>
    );
  }

  return (
    <form
      className="space-y-4 rounded-lg border border-border p-4"
      onSubmit={(event) => {
        event.preventDefault();

        const parsed = Number.parseInt(currentThreshold, 10);

        if (!Number.isFinite(parsed) || parsed < 1) {
          return;
        }

        updateMutation.mutate(parsed);
      }}
    >
      <div className="space-y-1">
        <h2 className="text-sm font-medium">Dislike threshold</h2>
        <p className="text-sm text-muted-foreground">
          Auto-flag pascos when dislikes reach this count.
        </p>
      </div>
      <Input
        type="number"
        min={1}
        value={currentThreshold}
        onChange={(event) => setThreshold(event.target.value)}
        aria-label="Dislike threshold"
      />
      <Button type="submit" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? <Spinner aria-hidden /> : null}
        Save threshold
      </Button>
    </form>
  );
}
