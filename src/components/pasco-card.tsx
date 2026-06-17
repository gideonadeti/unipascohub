import { Download, Eye, ThumbsUp } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEnumLabel } from "@/lib/catalog-labels";
import { getPascoDisplayTitle, pascoOverviewBadges } from "@/lib/pasco-display";
import { cn } from "@/lib/utils";
import type { Course } from "@/types/api/catalog";
import type { Pasco } from "@/types/api/pascos";

type PascoCardProps = {
  pasco: Pasco;
  title?: string;
  course?: Pick<Course, "code" | "title"> | null;
  className?: string;
};

function formatCount(count: number): string {
  return count.toLocaleString();
}

export function PascoCard({ pasco, title, course, className }: PascoCardProps) {
  const displayTitle = title ?? getPascoDisplayTitle(pasco, course);

  return (
    <Link
      href={`/pascos/${pasco.id}`}
      className={cn("group block h-full", className)}
      aria-label={`${displayTitle}. ${formatCount(pasco.viewCount)} views, ${formatCount(pasco.downloadCount)} downloads, ${formatCount(pasco.likeCount)} likes.`}
    >
      <Card className="h-full transition-colors group-hover:bg-muted/50">
        <CardHeader className="space-y-3">
          <CardTitle className="text-lg font-medium leading-snug">
            {displayTitle}
          </CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {pascoOverviewBadges.map((key) => (
              <Badge key={key} variant="secondary">
                {formatEnumLabel(pasco[key])}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground sm:text-sm">
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3.5" aria-hidden />
              <span>{formatCount(pasco.viewCount)}</span>
              <span className="sr-only">views</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Download className="size-3.5" aria-hidden />
              <span>{formatCount(pasco.downloadCount)}</span>
              <span className="sr-only">downloads</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="size-3.5" aria-hidden />
              <span>{formatCount(pasco.likeCount)}</span>
              <span className="sr-only">likes</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
