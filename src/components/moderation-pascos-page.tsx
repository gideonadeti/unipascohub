"use client";

import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PascoCard } from "@/components/pasco-card";
import { PascoListSkeleton } from "@/components/pasco-list-skeleton";
import { PascoModerationActions } from "@/components/pasco-moderation-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useModerationPascosList } from "@/hooks/api/use-moderation";
import { getPascoDisplayTitle } from "@/lib/pasco-display";

export function ModerationPascosPage() {
  const moderationQuery = useModerationPascosList({
    status: "PENDING_REVIEW",
    limit: 24,
  });

  if (moderationQuery.isPending) {
    return <PascoListSkeleton count={6} />;
  }

  if (moderationQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load review queue</AlertTitle>
        <AlertDescription>{moderationQuery.error.message}</AlertDescription>
      </Alert>
    );
  }

  const pascos = moderationQuery.data.pascos;

  if (pascos.length === 0) {
    return (
      <EmptyState
        title="No pascos pending review"
        description="Flagged pascos will appear here when dislike counts cross the threshold."
        icon={FileQuestion}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {pascos.map((pasco) => (
        <div key={pasco.id} className="space-y-3">
          <PascoCard pasco={pasco} emphasize="likes" />
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-sm text-muted-foreground">
              {getPascoDisplayTitle(pasco, pasco.course ?? null)}
              {pasco.uploader ? ` · ${pasco.uploader.name}` : null}
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={`/pascos/${pasco.id}`}
                className="text-sm underline-offset-4 hover:underline"
              >
                Review
              </Link>
              <PascoModerationActions pascoId={pasco.id} compact />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
