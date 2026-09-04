import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ProseContent } from "@/components/layout/prose-content";
import { privacyLastUpdated, privacySections } from "@/content/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Uni Pasco Hub handles your data.",
};

export default function PrivacyPage() {
  return (
    <PageContainer width="narrow">
      <div className="space-y-8">
        <PageHeader
          title="Privacy"
          description="How Uni Pasco Hub handles your data."
        />

        <p className="text-sm text-muted-foreground">
          Last updated: {privacyLastUpdated}
        </p>

        <ProseContent>
          {privacySections.map((section) => (
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
