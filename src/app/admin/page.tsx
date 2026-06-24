import type { Metadata } from "next";

import { AdminDashboardClient } from "@/components/admin-dashboard-client";

export const metadata: Metadata = {
  title: "Overview",
};

export default function AdminOverviewRoute() {
  return <AdminDashboardClient />;
}
