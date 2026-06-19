"use client";

import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AdminModerationSettings } from "@/components/admin-moderation-settings";
import { EmptyState } from "@/components/empty-state";
import { PascoCard } from "@/components/pasco-card";
import { PascoDeleteDialog } from "@/components/pasco-delete-dialog";
import { PascoListSkeleton } from "@/components/pasco-list-skeleton";
import { PascoManualFlagForm } from "@/components/pasco-manual-flag-form";
import { PascoModerationActions } from "@/components/pasco-moderation-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import { useModerationPascosList } from "@/hooks/api/use-moderation";
import { getPascoDisplayTitle } from "@/lib/pasco-display";
import { canUserDeletePasco, isAdminRole } from "@/lib/pasco-permissions";
import type {
  ModerationPascoListItem,
  PascoModerationStatus,
} from "@/types/api/pascos";

type ModerationTab = "PENDING_REVIEW" | "REJECTED";

function ModerationPascoCard({
  pasco,
  status,
}: {
  pasco: ModerationPascoListItem;
  status: PascoModerationStatus;
}) {
  const currentUser = useCurrentUser();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const canDelete =
    currentUser.data?.user && canUserDeletePasco(currentUser.data.user, pasco);

  return (
    <div className="space-y-3">
      <PascoCard pasco={pasco} emphasize="likes" />
      <div className="space-y-2 px-1">
        <p className="text-sm text-muted-foreground">
          {getPascoDisplayTitle(pasco, pasco.course ?? null)}
          {pasco.uploader ? ` · ${pasco.uploader.name}` : null}
        </p>
        {pasco.moderationNote ? (
          <p className="text-xs text-muted-foreground">
            Note: {pasco.moderationNote}
          </p>
        ) : null}
        {pasco.rejectionReason ? (
          <p className="text-xs text-muted-foreground">
            Reason: {pasco.rejectionReason}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/pascos/${pasco.id}`}
            className="text-sm underline-offset-4 hover:underline"
          >
            Review
          </Link>
          <PascoModerationActions pascoId={pasco.id} status={status} compact />
          {status === "REJECTED" && canDelete ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
              <PascoDeleteDialog
                pascoId={pasco.id}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ModerationPascosPage() {
  const [tab, setTab] = useState<ModerationTab>("PENDING_REVIEW");
  const currentUser = useCurrentUser();
  const isAdmin = isAdminRole(currentUser.data?.user?.role);

  const moderationQuery = useModerationPascosList({
    status: tab,
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

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <PascoManualFlagForm />
        {isAdmin ? <AdminModerationSettings /> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={tab === "PENDING_REVIEW" ? "default" : "outline"}
          onClick={() => setTab("PENDING_REVIEW")}
        >
          Pending
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "REJECTED" ? "default" : "outline"}
          onClick={() => setTab("REJECTED")}
        >
          Rejected
        </Button>
      </div>

      {pascos.length === 0 ? (
        <EmptyState
          title={
            tab === "PENDING_REVIEW"
              ? "No pascos pending review"
              : "No rejected pascos"
          }
          description={
            tab === "PENDING_REVIEW"
              ? "Flagged pascos will appear here when dislike counts cross the threshold or you send one manually."
              : "Rejected pascos appear here until restored or deleted."
          }
          icon={FileQuestion}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pascos.map((pasco) => (
            <ModerationPascoCard key={pasco.id} pasco={pasco} status={tab} />
          ))}
        </div>
      )}
    </div>
  );
}
