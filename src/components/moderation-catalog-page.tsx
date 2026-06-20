"use client";

import { LibraryBig } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CatalogSubmissionModerationActions } from "@/components/catalog-submission-moderation-actions";
import { EmptyState } from "@/components/empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useModerationCatalogSubmissionsList } from "@/hooks/api/use-catalog-submissions";
import { formatEnumLabel } from "@/lib/catalog-labels";
import type {
  CatalogSubmission,
  CatalogSubmissionStatus,
} from "@/types/api/catalog-submissions";

type ModerationTab = "PENDING" | "REJECTED";

function CatalogSubmissionCard({
  submission,
  status,
}: {
  submission: CatalogSubmission;
  status: CatalogSubmissionStatus;
}) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {submission.type === "PROGRAM" ? "Program" : "Course"}
          </Badge>
          <Badge variant="outline">{submission.status}</Badge>
        </div>
        <CardTitle className="text-base">{submission.summary}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {submission.institutionName} · {submission.submitter.name}
        </p>
        {submission.type === "COURSE" && submission.programIds.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Linked programs: {submission.programIds.length}
          </p>
        ) : null}
        {submission.type === "PROGRAM" && submission.programType ? (
          <p className="text-xs text-muted-foreground">
            Type: {formatEnumLabel(submission.programType)}
          </p>
        ) : null}
        {submission.rejectionReason ? (
          <p className="text-xs text-muted-foreground">
            Reason: {submission.rejectionReason}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <CatalogSubmissionModerationActions
            submissionId={submission.id}
            status={status}
            compact
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function ModerationCatalogPage() {
  const [tab, setTab] = useState<ModerationTab>("PENDING");

  const moderationQuery = useModerationCatalogSubmissionsList({
    status: tab,
    limit: 24,
  });

  if (moderationQuery.isPending) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8" aria-label="Loading catalog submissions" />
      </div>
    );
  }

  if (moderationQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load catalog review queue</AlertTitle>
        <AlertDescription>{moderationQuery.error.message}</AlertDescription>
      </Alert>
    );
  }

  const submissions = moderationQuery.data.submissions;

  return (
    <div className="space-y-8">
      <Alert>
        <AlertTitle>How catalog review works</AlertTitle>
        <AlertDescription>
          Course requests with a selected program are added automatically.
          Program requests still require approval in this queue.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={tab === "PENDING" ? "default" : "outline"}
          onClick={() => setTab("PENDING")}
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
        <Button type="button" size="sm" variant="ghost" asChild>
          <Link href="/moderation/pascos">Pasco review</Link>
        </Button>
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          title={
            tab === "PENDING"
              ? "No catalog submissions pending"
              : "No rejected catalog submissions"
          }
          description={
            tab === "PENDING"
              ? "Program requests from contributors appear here. Courses with a linked program are usually added automatically."
              : "Rejected submissions appear here for reference."
          }
          icon={LibraryBig}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {submissions.map((submission) => (
            <CatalogSubmissionCard
              key={submission.id}
              submission={submission}
              status={tab}
            />
          ))}
        </div>
      )}
    </div>
  );
}
