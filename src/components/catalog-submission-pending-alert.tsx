"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMyCatalogSubmissions } from "@/hooks/api/use-catalog-submissions";

type CatalogSubmissionPendingAlertProps = {
  institutionId: string;
};

export function CatalogSubmissionPendingAlert({
  institutionId,
}: CatalogSubmissionPendingAlertProps) {
  const pendingQuery = useMyCatalogSubmissions({
    institutionId,
    status: "PENDING",
  });

  const submissions = pendingQuery.data?.submissions ?? [];

  if (pendingQuery.isPending || submissions.length === 0) {
    return null;
  }

  return (
    <Alert>
      <AlertTitle>Awaiting catalog review</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {submissions.map((submission) => (
            <li key={submission.id}>
              {submission.summary} ({submission.type.toLowerCase()})
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
