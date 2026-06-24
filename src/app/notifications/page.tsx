import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationsPage } from "@/components/notifications-page";

export const metadata: Metadata = {
  title: "Notifications",
  description: "View your notification history.",
  robots: { index: false },
};

export default function NotificationsRoute() {
  return (
    <PageContainer width="narrow" className="space-y-8">
      <PageHeader
        title="Notifications"
        description="Review past notifications and manage your history."
      />
      <NotificationsPage />
    </PageContainer>
  );
}
