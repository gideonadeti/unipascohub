import type { Metadata } from "next";
import Link from "next/link";
import { SiBuymeacoffee } from "react-icons/si";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ProseContent } from "@/components/layout/prose-content";
import { Section } from "@/components/layout/section";
import { SponsorCard } from "@/components/sponsor-card";
import { Button } from "@/components/ui/button";
import { type SiteSponsor, siteLinks, siteSponsors } from "@/config/site";

export const metadata: Metadata = {
  title: "Sponsors",
  description: "Support Uni Pasco Hub and keep it running.",
};

const TIER_ORDER = {
  partner: 0,
  supporter: 1,
} as const;

function sortSponsors(sponsors: SiteSponsor[]): SiteSponsor[] {
  return [...sponsors].sort((left, right) => {
    const leftTier = left.tier ? TIER_ORDER[left.tier] : 2;
    const rightTier = right.tier ? TIER_ORDER[right.tier] : 2;

    if (leftTier !== rightTier) {
      return leftTier - rightTier;
    }

    return left.name.localeCompare(right.name);
  });
}

export default function SponsorsPage() {
  const sponsors = sortSponsors(siteSponsors);

  return (
    <PageContainer width="default">
      <div className="space-y-8">
        <PageHeader
          title="Sponsors"
          description="Sponsorship helps cover hosting, storage, and ongoing maintenance."
        />

        {siteLinks.buyMeACoffee ? (
          <div>
            <Button asChild>
              <a
                href={siteLinks.buyMeACoffee}
                target="_blank"
                rel="noopener noreferrer"
              >
                <SiBuymeacoffee aria-hidden />
                Support on Buy Me a Coffee
              </a>
            </Button>
          </div>
        ) : (
          <ProseContent>
            <p>
              To add a sponsorship link, set{" "}
              <code className="text-foreground">NEXT_PUBLIC_BMC_URL</code>. In
              the meantime, you can reach us via{" "}
              <Link href="/feedback">Feedback</Link>.
            </p>
          </ProseContent>
        )}

        {sponsors.length > 0 ? (
          <Section title="Our sponsors">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sponsors.map((sponsor) => (
                <SponsorCard key={sponsor.name} sponsor={sponsor} />
              ))}
            </div>
          </Section>
        ) : null}

        <ProseContent>
          <p>
            Contributions go toward hosting, file storage, and keeping Uni Pasco
            Hub fast and reliable for students.
          </p>
        </ProseContent>
      </div>
    </PageContainer>
  );
}
