"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  useStorageCleanupFailures,
  useStorageCleanupRuns,
  useTriggerOrphanCleanup,
} from "@/hooks/api/use-admin";

function CleanupForm() {
  const triggerMutation = useTriggerOrphanCleanup();
  const [dryRun, setDryRun] = useState(true);
  const [courseId, setCourseId] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trigger orphan cleanup</CardTitle>
        <CardDescription>
          Scan Cloudinary for assets with no matching database record.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(event) => setDryRun(event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Dry run (no deletions)
          </Label>
        </div>
        <div className="space-y-1">
          <Label htmlFor="courseId">Course ID (optional)</Label>
          <Input
            id="courseId"
            placeholder="Limit scan to a specific course"
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
          />
        </div>
        <Button
          onClick={() =>
            triggerMutation.mutate({
              dryRun,
              courseId: courseId.trim() || undefined,
            })
          }
          disabled={triggerMutation.isPending}
        >
          {triggerMutation.isPending ? <Spinner aria-hidden /> : null}
          {dryRun ? "Scan" : "Scan and delete"}
        </Button>
      </CardContent>
    </Card>
  );
}

function CleanupRunsTable() {
  const runsQuery = useStorageCleanupRuns();

  if (runsQuery.isPending) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (runsQuery.isError) {
    return (
      <p className="text-sm text-destructive">Could not load cleanup runs.</p>
    );
  }

  const runs = runsQuery.data?.runs ?? [];

  if (runs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No cleanup runs yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Date</th>
            <th className="pb-2 pr-4 font-medium">Scanned</th>
            <th className="pb-2 pr-4 font-medium">Orphans</th>
            <th className="pb-2 pr-4 font-medium">Deleted</th>
            <th className="pb-2 pr-4 font-medium">Failures</th>
            <th className="pb-2 font-medium">Type</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} className="border-b last:border-0">
              <td className="py-2 pr-4 text-muted-foreground">
                {new Date(run.createdAt).toLocaleDateString()}
              </td>
              <td className="py-2 pr-4">{run.scanned}</td>
              <td className="py-2 pr-4">{run.orphanCount}</td>
              <td className="py-2 pr-4">{run.deletedCount}</td>
              <td className="py-2 pr-4">{run.failureCount}</td>
              <td className="py-2">
                <Badge variant={run.dryRun ? "secondary" : "default"}>
                  {run.dryRun ? "Dry run" : "Cleanup"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CleanupFailuresTable() {
  const failuresQuery = useStorageCleanupFailures(false);

  if (failuresQuery.isPending) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (failuresQuery.isError) {
    return (
      <p className="text-sm text-destructive">
        Could not load cleanup failures.
      </p>
    );
  }

  const failures = failuresQuery.data?.failures ?? [];

  if (failures.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No unresolved failures.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Public ID</th>
            <th className="pb-2 pr-4 font-medium">Source</th>
            <th className="pb-2 pr-4 font-medium">Date</th>
            <th className="pb-2 font-medium">Resolved</th>
          </tr>
        </thead>
        <tbody>
          {failures.map((failure) => (
            <tr key={failure.id} className="border-b last:border-0">
              <td className="max-w-xs truncate py-2 pr-4 font-mono text-xs">
                {failure.publicId}
              </td>
              <td className="py-2 pr-4">
                <Badge variant="outline">{failure.source}</Badge>
              </td>
              <td className="py-2 pr-4 text-muted-foreground">
                {new Date(failure.createdAt).toLocaleDateString()}
              </td>
              <td className="py-2">
                {failure.resolvedAt ? (
                  <Badge variant="secondary">Resolved</Badge>
                ) : (
                  <Badge variant="destructive">Unresolved</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminStorageClient() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Storage</h1>
        <p className="text-sm text-muted-foreground">
          Manage Cloudinary storage and orphan cleanup.
        </p>
      </div>

      <CleanupForm />

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Recent runs</h2>
        <CleanupRunsTable />
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Unresolved failures</h2>
        <CleanupFailuresTable />
      </div>
    </div>
  );
}
