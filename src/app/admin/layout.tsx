import type { Metadata } from "next";

import { AdminGate } from "@/components/admin-gate";
import { AdminNav } from "@/components/admin-nav";
import { PageContainer } from "@/components/layout/page-container";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin | Uni Pasco Hub",
  },
  robots: { index: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGate>
      <PageContainer width="wide">
        <div className="space-y-8">
          <AdminNav />
          {children}
        </div>
      </PageContainer>
    </AdminGate>
  );
}
