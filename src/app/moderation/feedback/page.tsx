import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ModerationFeedbackPage } from "@/components/moderation-feedback-page";
import { ModerationGate } from "@/components/moderation-gate";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Review feedback submitted by users.",
  robots: { index: false },
};

export default function ModerationFeedbackRoute() {
  return (
    <PageContainer width="narrow" className="space-y-8">
      <PageHeader
        title="Feedback"
        description="Review and manage feedback from users."
      />
      <ModerationGate>
        <ModerationFeedbackPage />
      </ModerationGate>
    </PageContainer>
  );
}
