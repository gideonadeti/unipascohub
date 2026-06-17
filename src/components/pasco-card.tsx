import { Download, Eye, ThumbsUp } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEnumLabel } from "@/lib/catalog-labels";
import { cn } from "@/lib/utils";
import type { Pasco } from "@/types/api/pascos";

type PascoCardProps = {
  pasco: Pasco;
  title?: string;
  className?: string;
};

function formatCount(count: number): string {
  return count.toLocaleString();
}

export function PascoCard({ pasco, title, className }: PascoCardProps) {
  const displayTitle =
    title ?? `${pasco.academicYear} · ${formatEnumLabel(pasco.educationLevel)}`;

  const badges = [
    pasco.type,
    pasco.educationLevel,
    pasco.semesterType,
    pasco.contentType,
  ] as const;

  return (
    <Link
      href={`/pascos/${pasco.id}`}
      className={cn("group block h-full", className)}
    >
      <Card className="h-full transition-colors group-hover:bg-muted/50">
        <CardHeader className="space-y-3">
          <CardTitle className="text-lg font-medium leading-snug">
            {displayTitle}
          </CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {badges.map((value) => (
              <Badge key={value} variant="secondary">
                {formatEnumLabel(value)}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground sm:text-sm">
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3.5" aria-hidden />
              {formatCount(pasco.viewCount)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Download className="size-3.5" aria-hidden />
              {formatCount(pasco.downloadCount)}
            </span>
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="size-3.5" aria-hidden />
              {formatCount(pasco.likeCount)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
