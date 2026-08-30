import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ProseContent } from "@/components/layout/prose-content";
import { termsLastUpdated, termsSections } from "@/content/legal/terms";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for Uni Pasco Hub.",
};

export default function TermsPage() {
  return (
    <PageContainer width="narrow">
      <div className="space-y-8">
        <PageHeader
          title="Terms"
          description="Draft terms of use for Uni Pasco Hub."
        />

        <p className="text-sm text-muted-foreground">
          Last updated: {termsLastUpdated}
        </p>

        <ProseContent>
          {termsSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </div>
          ))}
        </ProseContent>
      </div>
    </PageContainer>
  );
}
