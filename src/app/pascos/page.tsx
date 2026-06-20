import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PascoBrowsePage } from "@/components/pasco-browse-page";
import { PascoListSkeleton } from "@/components/pasco-list-skeleton";
import { siteDescription } from "@/config/site";

export const metadata: Metadata = {
  title: "Browse pascos",
  description: siteDescription,
};

export default function BrowsePascosPage() {
  return (
    <PageContainer width="default" className="space-y-8">
      <PageHeader
        title="Browse pascos"
        description="Filter and discover past exam papers shared by students."
      />
      <Suspense fallback={<PascoListSkeleton count={12} />}>
        <PascoBrowsePage />
      </Suspense>
    </PageContainer>
  );
}
