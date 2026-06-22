"use client";

import { LibraryBig, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { PascoBrowsePagination } from "@/components/pasco-browse-pagination";
import { PascoCard } from "@/components/pasco-card";
import { PascoListSkeleton } from "@/components/pasco-list-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useMyCatalogSubmissions } from "@/hooks/api/use-catalog-submissions";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import { useMyPascosList } from "@/hooks/api/use-pascos";
import { formatEnumLabel } from "@/lib/catalog-labels";
import { formatDateTime } from "@/lib/dates";
import { buildPascoCreateHref } from "@/lib/pasco-create-href";
import { canUserModifyPasco } from "@/lib/pasco-permissions";
import type {
  CatalogSubmission,
  CatalogSubmissionStatus,
} from "@/types/api/catalog-submissions";
import type { Pasco, PascoModerationStatus } from "@/types/api/pascos";

type ContributionsTab = "uploads" | "catalog";

type UploadStatusFilter = PascoModerationStatus | "ALL";
type CatalogStatusFilter = CatalogSubmissionStatus | "ALL";

const UPLOAD_STATUS_OPTIONS: { value: UploadStatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PUBLISHED", label: "Published" },
  { value: "PENDING_REVIEW", label: "Under review" },
  { value: "REJECTED", label: "Rejected" },
];

const CATALOG_STATUS_OPTIONS: {
  value: CatalogStatusFilter;
  label: string;
}[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function getCatalogUploadHref(submission: CatalogSubmission): string | null {
  if (submission.status !== "APPROVED") {
    return null;
  }

  return buildPascoCreateHref({
    institutionId: submission.institutionId,
    programId: submission.approvedProgramId ?? undefined,
    courseId: submission.approvedCourseId ?? undefined,
  });
}

function moderationStatusLabel(status: PascoModerationStatus): string {
  if (status === "PENDING_REVIEW") {
    return "Under review";
  }

  return formatEnumLabel(status);
}

function MyUploadCard({ pasco }: { pasco: Pasco }) {
  const currentUser = useCurrentUser();
  const canEdit =
    currentUser.data?.user && canUserModifyPasco(currentUser.data.user, pasco);
  const status = pasco.moderationStatus ?? "PUBLISHED";

  return (
    <div className="space-y-3">
      <div className="relative">
        <PascoCard pasco={pasco} showInstitution />
        <div className="absolute top-3 right-3">
          <Badge
            variant={
              status === "REJECTED"
                ? "destructive"
                : status === "PENDING_REVIEW"
                  ? "secondary"
                  : "outline"
            }
          >
            {moderationStatusLabel(status)}
          </Badge>
        </div>
      </div>
      <div className="space-y-2 px-1">
        {pasco.rejectionReason ? (
          <p className="text-xs text-muted-foreground">
            Reason: {pasco.rejectionReason}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/pascos/${pasco.id}`}
            className="text-sm underline-offset-4 hover:underline"
          >
            View
          </Link>
          {canEdit ? (
            <Link
              href={`/pascos/${pasco.id}/edit`}
              className="text-sm underline-offset-4 hover:underline"
            >
              Edit
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MyCatalogSubmissionCard({
  submission,
}: {
  submission: CatalogSubmission;
}) {
  const uploadHref = getCatalogUploadHref(submission);

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {submission.type === "PROGRAM" ? "Program" : "Course"}
          </Badge>
          <Badge
            variant={
              submission.status === "REJECTED" ? "destructive" : "outline"
            }
          >
            {submission.status}
          </Badge>
        </div>
        <CardTitle className="text-base">{submission.summary}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {submission.institutionName}
        </p>
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
        {submission.reviewedAt ? (
          <p className="text-xs text-muted-foreground">
            Reviewed {formatDateTime(submission.reviewedAt)}
          </p>
        ) : null}
        {uploadHref ? (
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href={uploadHref}>Upload a pasco</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ContributionsUploadsPanel({
  moderationStatus,
  page,
  onModerationStatusChange,
  onPageChange,
}: {
  moderationStatus: UploadStatusFilter;
  page: number;
  onModerationStatusChange: (value: UploadStatusFilter) => void;
  onPageChange: (page: number) => void;
}) {
  const uploadsQuery = useMyPascosList({
    moderationStatus: moderationStatus === "ALL" ? undefined : moderationStatus,
    page,
    limit: 12,
  });

  if (uploadsQuery.isPending) {
    return <PascoListSkeleton count={6} />;
  }

  if (uploadsQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load your uploads</AlertTitle>
        <AlertDescription>{uploadsQuery.error.message}</AlertDescription>
      </Alert>
    );
  }

  const { pascos, pagination } = uploadsQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {UPLOAD_STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={moderationStatus === option.value ? "default" : "outline"}
            onClick={() => onModerationStatusChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
        <Button type="button" size="sm" variant="ghost" asChild>
          <Link href="/pascos/new">Upload new pasco</Link>
        </Button>
      </div>

      {pascos.length === 0 ? (
        <EmptyState
          title="No uploads yet"
          description="Upload your first pasco to share past questions with other students."
          icon={Upload}
          action={{ label: "Upload a pasco", href: "/pascos/new" }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pascos.map((pasco) => (
              <MyUploadCard key={pasco.id} pasco={pasco} />
            ))}
          </div>
          <PascoBrowsePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  );
}

function ContributionsCatalogPanel({
  status,
  onStatusChange,
}: {
  status: CatalogStatusFilter;
  onStatusChange: (value: CatalogStatusFilter) => void;
}) {
  const catalogQuery = useMyCatalogSubmissions({
    status: status === "ALL" ? undefined : status,
  });

  if (catalogQuery.isPending) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8" aria-label="Loading catalog requests" />
      </div>
    );
  }

  if (catalogQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load catalog requests</AlertTitle>
        <AlertDescription>{catalogQuery.error.message}</AlertDescription>
      </Alert>
    );
  }

  const submissions = catalogQuery.data.submissions;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {CATALOG_STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={status === option.value ? "default" : "outline"}
            onClick={() => onStatusChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
        <Button type="button" size="sm" variant="ghost" asChild>
          <Link href="/pascos/new">Request from upload form</Link>
        </Button>
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          title="No catalog requests"
          description="Request a missing program or course from the upload form when you cannot find it in the catalog."
          icon={LibraryBig}
          action={{ label: "Go to upload form", href: "/pascos/new" }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {submissions.map((submission) => (
            <MyCatalogSubmissionCard
              key={submission.id}
              submission={submission}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ContributionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab: ContributionsTab =
    searchParams.get("tab") === "catalog" ? "catalog" : "uploads";
  const moderationStatusParam = searchParams.get("moderationStatus");
  const moderationStatus: UploadStatusFilter =
    moderationStatusParam === "PUBLISHED" ||
    moderationStatusParam === "PENDING_REVIEW" ||
    moderationStatusParam === "REJECTED"
      ? moderationStatusParam
      : "ALL";
  const catalogStatusParam = searchParams.get("status");
  const catalogStatus: CatalogStatusFilter =
    catalogStatusParam === "PENDING" ||
    catalogStatusParam === "APPROVED" ||
    catalogStatusParam === "REJECTED"
      ? catalogStatusParam
      : "ALL";
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
  );

  function pushParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={tab === "uploads" ? "default" : "outline"}
          onClick={() =>
            pushParams({
              tab: "uploads",
              status: undefined,
              page: undefined,
            })
          }
        >
          Uploads
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "catalog" ? "default" : "outline"}
          onClick={() =>
            pushParams({
              tab: "catalog",
              moderationStatus: undefined,
              page: undefined,
            })
          }
        >
          Catalog requests
        </Button>
      </div>

      {tab === "uploads" ? (
        <ContributionsUploadsPanel
          moderationStatus={moderationStatus}
          page={page}
          onModerationStatusChange={(value) =>
            pushParams({
              tab: "uploads",
              moderationStatus: value === "ALL" ? undefined : value,
              page: undefined,
            })
          }
          onPageChange={(nextPage) =>
            pushParams({
              tab: "uploads",
              page: nextPage <= 1 ? undefined : String(nextPage),
            })
          }
        />
      ) : (
        <ContributionsCatalogPanel
          status={catalogStatus}
          onStatusChange={(value) =>
            pushParams({
              tab: "catalog",
              status: value === "ALL" ? undefined : value,
            })
          }
        />
      )}
    </div>
  );
}
