import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsPage } from "@/components/settings-page";
import { SignedInGate } from "@/components/signed-in-gate";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile and account preferences.",
  robots: { index: false },
};

export default function SettingsRoute() {
  return (
    <PageContainer width="narrow" className="space-y-8">
      <PageHeader
        title="Settings"
        description="Update your profile and manage account preferences."
      />
      <SignedInGate description="You must be signed in to manage your settings.">
        <SettingsPage />
      </SignedInGate>
    </PageContainer>
  );
}
