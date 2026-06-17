"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { PascoDeleteDialog } from "@/components/pasco-delete-dialog";
import { PascoEngagementBar } from "@/components/pasco-engagement-bar";
import { PascoFileActions } from "@/components/pasco-file-actions";
import { PascoFileView } from "@/components/pasco-file-view";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useCourse } from "@/hooks/api/use-courses";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import { useRecordPascoView } from "@/hooks/api/use-pasco-engagement";
import { usePasco } from "@/hooks/api/use-pascos";
import { formatEnumLabel } from "@/lib/catalog-labels";
import { canUserModifyPasco } from "@/lib/pasco-permissions";
import type { PascoFile } from "@/types/api/pascos";

export function PascoDetail() {
  const params = useParams<{ pascoId: string }>();
  const pascoId = params.pascoId ?? "";
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewFile, setViewFile] = useState<PascoFile | null>(null);
  const pascoQuery = usePasco(pascoId);
  const courseId = pascoQuery.data?.pasco.courseId ?? "";
  const courseQuery = useCourse(courseId);
  const currentUser = useCurrentUser();
  useRecordPascoView(pascoId, pascoQuery.isSuccess);

  if (pascoQuery.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Loading pasco…
      </div>
    );
  }

  if (pascoQuery.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load pasco</AlertTitle>
        <AlertDescription>{pascoQuery.error.message}</AlertDescription>
      </Alert>
    );
  }

  const pasco = pascoQuery.data.pasco;
  const courseLabel = courseQuery.data?.course
    ? `${courseQuery.data.course.code} — ${courseQuery.data.course.title}`
    : pasco.courseId;
  const canEdit =
    currentUser.data?.user && canUserModifyPasco(currentUser.data.user, pasco);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Pasco details</CardTitle>
          <CardDescription>ID: {pasco.id}</CardDescription>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={`/pascos/${pascoId}/edit`}>Edit</Link>
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          </div>
        )}
      </CardHeader>
      <PascoDeleteDialog
        pascoId={pascoId}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
      <CardContent className="space-y-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Course</dt>
            <dd>{courseLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Academic year</dt>
            <dd>{pasco.academicYear}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Education level</dt>
            <dd>{formatEnumLabel(pasco.educationLevel)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Semester</dt>
            <dd>{formatEnumLabel(pasco.semesterType)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Type</dt>
            <dd>{formatEnumLabel(pasco.type)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Content type</dt>
            <dd>{formatEnumLabel(pasco.contentType)}</dd>
          </div>
          {pasco.solutionCompleteness && (
            <div>
              <dt className="text-muted-foreground">Solution completeness</dt>
              <dd>{formatEnumLabel(pasco.solutionCompleteness)}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Complete upload</dt>
            <dd>{pasco.isComplete ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{new Date(pasco.createdAt).toLocaleString()}</dd>
          </div>
        </dl>

        {pasco.description && (
          <div>
            <h3 className="mb-1 text-sm font-medium">Description</h3>
            <p className="text-sm text-muted-foreground">{pasco.description}</p>
          </div>
        )}

        <PascoEngagementBar pascoId={pascoId} pasco={pasco} />

        <div>
          <h3 className="mb-2 text-sm font-medium">Files</h3>
          <ul className="space-y-2">
            {pasco.files.map((file) => (
              <li key={file.id}>
                <PascoFileActions
                  pascoId={pascoId}
                  file={file}
                  onView={setViewFile}
                />
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <PascoFileView file={viewFile} onClose={() => setViewFile(null)} />
    </Card>
  );
}
