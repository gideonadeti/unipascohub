import type { Metadata } from "next";

import { AdminStorageClient } from "@/components/admin-storage-client";

export const metadata: Metadata = {
  title: "Storage",
};

export default function AdminStorageRoute() {
  return <AdminStorageClient />;
}
