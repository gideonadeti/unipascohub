import type { Metadata } from "next";
import Link from "next/link";

import { ContributorCard } from "@/components/contributor-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import {
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

  return (
    <PageContainer width="default">
      <div className="space-y-8">
        <PageHeader
          title="Contributors"
          description="Thanks to everyone who builds and maintains Uni Pasco Hub."
        />

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

        {siteLinks.github ? (
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <Link
                href={siteLinks.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                View the repository
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
