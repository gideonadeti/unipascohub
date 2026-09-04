import type { Metadata } from "next";

import { AdminCatalogClient } from "@/components/admin-catalog-client";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Catalog",
};

export default function AdminCatalogRoute() {
  return <AdminCatalogClient />;
}
