import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteCredits } from "@/config/site";

export const metadata: Metadata = {
  title: "Contributors",
  description: "People who build and maintain Uni Pasco Hub.",
};

export default function ContributorsPage() {
  const contributors = siteCredits.contributors;

  return (
    <PageContainer width="default">
      <div className="space-y-8">
        <PageHeader
          title="Contributors"
          description="Thanks to everyone who builds and maintains Uni Pasco Hub."
        />

        <Section title="Lead">
          <Card>
            <CardHeader>
              <CardTitle>{siteCredits.lead}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground sm:text-base">
              Engineered and maintained with care.
            </CardContent>
          </Card>
        </Section>

        <Section
          title="Contributors"
          description="More names will appear here as the project grows."
        >
          {contributors.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground sm:text-base">
                No additional contributors have been listed yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contributors.map((contributor) => (
                <Card key={contributor.name}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {contributor.url ? (
                        <a
                          href={contributor.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline-offset-4 hover:underline"
                        >
                          {contributor.name}
                        </a>
                      ) : (
                        contributor.name
                      )}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </Section>
      </div>
    </PageContainer>
  );
}
