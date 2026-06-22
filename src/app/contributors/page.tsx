import type { Metadata } from "next";
import Link from "next/link";
import { FaXTwitter } from "react-icons/fa6";

import { ContributorCard } from "@/components/contributor-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ProseContent } from "@/components/layout/prose-content";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import {
  getLeadContributor,
  type SiteContributor,
  siteContributors,
  siteLinks,
} from "@/config/site";

export const metadata: Metadata = {
  title: "Contributors",
  description: "People who build and maintain Uni Pasco Hub.",
};

function sortContributors(contributors: SiteContributor[]): SiteContributor[] {
  return [...contributors].sort((left, right) => {
    if (left.role === "lead" && right.role !== "lead") {
      return -1;
    }

    if (right.role === "lead" && left.role !== "lead") {
      return 1;
    }

    return left.name.localeCompare(right.name);
  });
}

export default function ContributorsPage() {
  const contributors = sortContributors(siteContributors);
  const lead = getLeadContributor();
  const leadFirstName = lead?.name.trim().split(/\s+/)[0];

  return (
    <PageContainer width="default">
      <div className="space-y-8">
        <PageHeader
          title="Contributors"
          description="Thanks to everyone who builds and maintains Uni Pasco Hub."
        />

        <Section
          title="Want to help?"
          description="Share pascos on your own, or reach out to join development."
        >
          <ProseContent>
            <p>
              To <strong>upload pascos</strong>, sign in and use{" "}
              <Link href="/pascos/new">Upload pasco</Link>. You can upgrade to
              contributor from there — no invite needed.
            </p>
            <p>
              The codebase is private while the platform is in active
              development. If you would like to contribute code or help maintain
              the project, send{" "}
              {lead ? <strong>{lead.name}</strong> : "the project lead"} a DM on
              X for repository access.
            </p>
          </ProseContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/pascos/new">Upload pasco</Link>
            </Button>
            {siteLinks.twitter ? (
              <Button variant="outline" asChild>
                <a
                  href={siteLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaXTwitter aria-hidden />
                  DM {leadFirstName ?? lead?.name ?? "the lead"} on X
                </a>
              </Button>
            ) : null}
          </div>
        </Section>

        <Section
          title="Team"
          description="More names will appear here as the project grows."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contributors.map((contributor) => (
              <ContributorCard
                key={contributor.name}
                contributor={contributor}
              />
            ))}
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}
