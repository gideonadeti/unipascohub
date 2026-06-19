import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ModerationGate } from "@/components/moderation-gate";
import { ModerationPascosPage } from "@/components/moderation-pascos-page";

export const metadata: Metadata = {
  title: "Moderation",
  description: "Review pascos flagged for moderation.",
};

export default function ModerationPascosRoute() {
  return (
    <PageContainer width="default" className="space-y-8">
      <PageHeader
        title="Moderation queue"
        description="Review pascos hidden after reaching the dislike threshold."
      />
      <ModerationGate>
        <ModerationPascosPage />
      </ModerationGate>
    </PageContainer>
  );
}
