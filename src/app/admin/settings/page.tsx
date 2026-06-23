import type { Metadata } from "next";
import { AdminModerationSettings } from "@/components/admin-moderation-settings";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Settings",
};

export default function AdminSettingsRoute() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage application-wide settings."
      />
      <AdminModerationSettings />
    </div>
  );
}
