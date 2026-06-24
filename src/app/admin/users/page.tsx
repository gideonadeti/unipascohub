import type { Metadata } from "next";

import { AdminUsersClient } from "@/components/admin-users-client";

export const metadata: Metadata = {
  title: "Users",
};

export default function AdminUsersRoute() {
  return <AdminUsersClient />;
}
