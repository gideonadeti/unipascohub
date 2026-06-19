import { Clock, Download, Eye, FileText, ThumbsUp } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatPascoRelativeDate,
  getPascoCardBadges,
  getPascoDisplayDescription,
  getPascoDisplayTitle,
  getPascoInstitutionName,
  type PascoCardBadgeKey,
  type PascoCardEmphasis,
} from "@/lib/pasco-display";
import { cn } from "@/lib/utils";
import type { Pasco, PascoCourseSummary } from "@/types/api/pascos";

type PascoCardProps = {
  pasco: Pasco;
  course?: PascoCourseSummary | null;
  className?: string;
  emphasize?: PascoCardEmphasis;
  hiddenBadgeKeys?: PascoCardBadgeKey[];
  showInstitution?: boolean;
};

type MetaItem = {
  icon: ReactNode;
  label: string;
  value: string;
  emphasized?: boolean;
};

function formatCount(count: number): string {
  return count.toLocaleString();
}

function formatFileCount(count: number): string {
  return count === 1 ? "1 file" : `${count} files`;
}

function getMetaItems(pasco: Pasco, emphasize: PascoCardEmphasis): MetaItem[] {
  const views: MetaItem = {
    icon: <Eye className="size-3.5" aria-hidden />,
    label: "views",
    value: formatCount(pasco.viewCount),
  };
  const downloads: MetaItem = {
    icon: <Download className="size-3.5" aria-hidden />,
    label: "downloads",
    value: formatCount(pasco.downloadCount),
  };
  const files: MetaItem = {
    icon: <FileText className="size-3.5" aria-hidden />,
    label: "files",
    value: formatFileCount(pasco.files.length),
  };

  switch (emphasize) {
    case "views":
      return [{ ...views, emphasized: true }, downloads, files];
    case "downloads":
      return [{ ...downloads, emphasized: true }, views, files];
    case "likes":
      return [
        {
          icon: <ThumbsUp className="size-3.5" aria-hidden />,
          label: "likes",
          value: formatCount(pasco.likeCount),
          emphasized: true,
        },
        views,
        files,
      ];
    default:
      return [
        {
          icon: <Clock className="size-3.5" aria-hidden />,
          label: "uploaded",
          value: formatPascoRelativeDate(pasco.createdAt),
          emphasized: true,
        },
        views,
        files,
      ];
  }
}

function MetaStat({ icon, label, value, emphasized }: MetaItem) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        emphasized ? "text-foreground" : undefined,
      )}
    >
      {icon}
      <span>{value}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PascoCard({
  pasco,
  course: courseProp,
  className,
  emphasize = "createdAt",
  hiddenBadgeKeys,
  showInstitution = true,
}: PascoCardProps) {
  const course = courseProp ?? pasco.course ?? null;
  const displayTitle = getPascoDisplayTitle(pasco, course);
  const displayDescription = getPascoDisplayDescription(pasco, course);
  const institutionName =
    showInstitution && course ? getPascoInstitutionName(course) : undefined;
  const badges = getPascoCardBadges(pasco, { hiddenKeys: hiddenBadgeKeys });
  const metaItems = getMetaItems(pasco, emphasize);
  const emphasizedItem =
    metaItems.find((item) => item.emphasized) ?? metaItems[0];

  const ariaLabel = [
    institutionName,
    displayTitle,
    displayDescription,
    `${emphasizedItem.value} ${emphasizedItem.label}`,
    formatFileCount(pasco.files.length),
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Link
      href={`/pascos/${pasco.id}`}
      className={cn("group block h-full", className)}
      aria-label={ariaLabel}
    >
      <Card className="h-full transition-colors group-hover:bg-muted/50">
        <CardHeader className="space-y-3">
          <div className="space-y-1">
            {institutionName ? (
              <p className="text-xs text-muted-foreground">{institutionName}</p>
            ) : null}
            <CardTitle className="text-lg font-medium leading-snug">
              {displayTitle}
            </CardTitle>
            {displayDescription ? (
              <p className="text-sm text-muted-foreground">
                {displayDescription}
              </p>
            ) : null}
          </div>
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <Badge key={badge.key} variant={badge.variant}>
                  {badge.label}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground sm:text-sm">
            {metaItems.map((item) => (
              <MetaStat key={item.label} {...item} />
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
