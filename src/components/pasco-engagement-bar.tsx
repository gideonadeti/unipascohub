"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { Download, Eye, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSetPascoReaction } from "@/hooks/api/use-pasco-engagement";
import { getNextReaction } from "@/lib/pasco-reaction";
import { cn } from "@/lib/utils";
import type { Pasco, PascoReactionType } from "@/types/api/pascos";

type PascoEngagementBarProps = {
  pascoId: string;
  pasco: Pick<
    Pasco,
    | "likeCount"
    | "dislikeCount"
    | "downloadCount"
    | "viewCount"
    | "viewerReaction"
  >;
};

function formatCount(count: number): string {
  return count.toLocaleString();
}

type ReactionButtonProps = {
  label: string;
  count: number;
  active: boolean;
  icon: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
};

function ReactionButton({
  label,
  count,
  active,
  icon,
  disabled,
  onClick,
}: ReactionButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "outline"}
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className={cn("min-h-11 sm:min-h-8", active && "border-primary/40")}
      aria-pressed={active}
      aria-label={`${label} (${formatCount(count)})`}
    >
      {icon}
      <span>{formatCount(count)}</span>
    </Button>
  );
}

function SignedOutReactionButton({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <SignInButton mode="modal">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-11 sm:min-h-8"
        aria-label={`${label} (${formatCount(count)}) — sign in required`}
      >
        {icon}
        <span>{formatCount(count)}</span>
      </Button>
    </SignInButton>
  );
}

export function PascoEngagementBar({
  pascoId,
  pasco,
}: PascoEngagementBarProps) {
  const { isSignedIn } = useAuth();
  const reactionMutation = useSetPascoReaction(pascoId);

  function handleReaction(target: PascoReactionType) {
    const nextReaction = getNextReaction(pasco.viewerReaction, target);
    reactionMutation.mutate(nextReaction);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {isSignedIn ? (
          <>
            <ReactionButton
              label="Like"
              count={pasco.likeCount}
              active={pasco.viewerReaction === "LIKE"}
              disabled={reactionMutation.isPending}
              icon={<ThumbsUp />}
              onClick={() => handleReaction("LIKE")}
            />
            <ReactionButton
              label="Dislike"
              count={pasco.dislikeCount}
              active={pasco.viewerReaction === "DISLIKE"}
              disabled={reactionMutation.isPending}
              icon={<ThumbsDown />}
              onClick={() => handleReaction("DISLIKE")}
            />
          </>
        ) : (
          <>
            <SignedOutReactionButton
              label="Like"
              count={pasco.likeCount}
              icon={<ThumbsUp />}
            />
            <SignedOutReactionButton
              label="Dislike"
              count={pasco.dislikeCount}
              icon={<ThumbsDown />}
            />
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Eye className="size-4" aria-hidden />
          {formatCount(pasco.viewCount)} views
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Download className="size-4" aria-hidden />
          {formatCount(pasco.downloadCount)} downloads
        </span>
      </div>
    </div>
  );
}
