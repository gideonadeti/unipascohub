import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ModerationCatalogPage } from "@/components/moderation-catalog-page";
import { ModerationGate } from "@/components/moderation-gate";

export const metadata: Metadata = {
  title: "Catalog moderation",
  description: "Review contributor requests for new programs and courses.",
  robots: { index: false },
};

export default function ModerationCatalogRoute() {
  return (
    <PageContainer width="default" className="space-y-8">
      <PageHeader
        title="Catalog review"
        description="Approve or reject contributor requests for programs and courses."
      />
      <ModerationGate>
        <ModerationCatalogPage />
      </ModerationGate>
    </PageContainer>
  );
}
