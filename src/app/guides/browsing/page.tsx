import type { Metadata } from "next";

import { GuideContent } from "@/components/layout/guide-content";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { browsingGuide } from "@/content/guides/browsing";

export const metadata: Metadata = {
  title: "How to browse",
  description: browsingGuide.description,
};

export default function BrowsingGuidePage() {
  return (
    <PageContainer width="narrow">
      <div className="space-y-8">
        <PageHeader
          title={browsingGuide.title}
          description={browsingGuide.description}
        />
        <GuideContent guide={browsingGuide} />
      </div>
    </PageContainer>
  );
}
