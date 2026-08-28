import type { Metadata } from "next";
import Link from "next/link";
import { FaGithub } from "react-icons/fa6";

import { ContributorCard } from "@/components/contributor-card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ProseContent } from "@/components/layout/prose-content";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import {
  type SiteContributor,
  siteContributors,
  siteRepoUrl,
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
          title="Want to help?"
          description="Share pascos on your own, or help build the platform."
        >
          <ProseContent>
            <p>
              To <strong>upload pascos</strong>, sign in and use{" "}
              <Link href="/pascos/new">Upload pasco</Link>. You can upgrade to
              contributor from there — no invite needed.
            </p>
            <p>
              The codebase is open source under the MIT license at{" "}
              <a href={siteRepoUrl} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              . To contribute code or help maintain the project, start with the
              <a
                href={`${siteRepoUrl}/blob/main/CONTRIBUTING.md`}
                target="_blank"
                rel="noopener noreferrer"
              >
                contributing guide
              </a>
              , then open an issue or pull request.
            </p>
          </ProseContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/pascos/new">Upload pasco</Link>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={`${siteRepoUrl}/issues`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGithub aria-hidden />
                Browse open issues
              </a>
            </Button>
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
