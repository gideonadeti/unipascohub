import type { Metadata } from "next";
import { Suspense } from "react";

import { ContributionsPage } from "@/components/contributions-page";
import { ContributorGate } from "@/components/contributor-gate";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PascoListSkeleton } from "@/components/pasco-list-skeleton";

export const metadata: Metadata = {
  title: "My contributions",
  description: "View and manage your pasco uploads and catalog requests.",
  robots: { index: false },
};

export default function ContributionsRoute() {
  return (
    <PageContainer width="default" className="space-y-8">
      <PageHeader
        title="My contributions"
        description="Track your pasco uploads and catalog requests in one place."
      />
      <ContributorGate>
        <Suspense fallback={<PascoListSkeleton count={6} />}>
          <ContributionsPage />
        </Suspense>
      </ContributorGate>
    </PageContainer>
  );
}
