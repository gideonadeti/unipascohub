import { ExternalLink } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SiteSponsor } from "@/config/site";
import { getDisplayInitials } from "@/lib/contributor-links";

type SponsorCardProps = {
  sponsor: SiteSponsor;
};

const TIER_LABELS = {
  partner: "Partner",
  supporter: "Supporter",
} as const;

function getSponsorLinkLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Visit website";
  }
}

export function SponsorCard({ sponsor }: SponsorCardProps) {
  const initials = getDisplayInitials(sponsor.name);
  const linkLabel = getSponsorLinkLabel(sponsor.url);

  const logo = (
    <Avatar
      size="lg"
      className="size-12 rounded-lg after:rounded-lg **:data-[slot=avatar-image]:rounded-lg **:data-[slot=avatar-fallback]:rounded-lg"
    >
      {sponsor.logoUrl ? (
        <AvatarImage src={sponsor.logoUrl} alt="" className="rounded-lg" />
      ) : null}
      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
    </Avatar>
  );

  return (
    <Card>
      <CardContent className="flex items-start gap-4 pt-6">
        <a
          href={sponsor.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-label={`Visit ${sponsor.name}`}
        >
          {logo}
        </a>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline-offset-4 hover:underline"
            >
              {sponsor.name}
            </a>
            {sponsor.tier ? (
              <Badge variant="secondary">{TIER_LABELS[sponsor.tier]}</Badge>
            ) : null}
          </div>
          <a
            href={sponsor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ExternalLink className="size-4 shrink-0" aria-hidden />
            <span>{linkLabel}</span>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
