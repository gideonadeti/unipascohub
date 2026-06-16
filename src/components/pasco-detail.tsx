"use client";

import { useParams } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { usePasco } from "@/hooks/api/use-pascos";

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function PascoDetail() {
  const params = useParams<{ pascoId: string }>();
  const pascoId = params.pascoId ?? "";
  const pascoQuery = usePasco(pascoId);

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

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Pasco details</CardTitle>
        <CardDescription>ID: {pasco.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Course ID</dt>
            <dd>{pasco.courseId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Academic year</dt>
            <dd>{pasco.academicYear}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Education level</dt>
            <dd>{formatLabel(pasco.educationLevel)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Semester</dt>
            <dd>{formatLabel(pasco.semesterType)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Type</dt>
            <dd>{formatLabel(pasco.type)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Content type</dt>
            <dd>{formatLabel(pasco.contentType)}</dd>
          </div>
          {pasco.solutionCompleteness && (
            <div>
              <dt className="text-muted-foreground">Solution completeness</dt>
              <dd>{formatLabel(pasco.solutionCompleteness)}</dd>
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

        <div>
          <h3 className="mb-2 text-sm font-medium">Files</h3>
          <ul className="space-y-2">
            {pasco.files.map((file) => (
              <li key={file.id}>
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  {file.order}. {file.fileName}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
