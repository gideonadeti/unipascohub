import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const detailFieldSkeletonKeys = [
  "course",
  "year",
  "level",
  "semester",
  "type",
  "content",
  "complete",
  "created",
] as const;

export function PascoDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3 sm:h-9" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      <Card className="w-full">
        <CardContent className="space-y-8 pt-6">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {detailFieldSkeletonKeys.map((key) => (
              <div key={key} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full max-w-48" />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full max-w-xs" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
