import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PascoCreateForm } from "@/components/pasco-create-form";
import { PascoCreateGate } from "@/components/pasco-create-gate";
import { Spinner } from "@/components/ui/spinner";
import { siteDescription } from "@/config/site";

export const metadata: Metadata = {
  title: "Upload pasco",
  description: siteDescription,
};

function PascoCreateFormFallback() {
  return (
    <div className="flex justify-center py-16">
      <Spinner className="size-8" aria-label="Loading upload form" />
    </div>
  );
}

export default function NewPascoPage() {
  return (
    <PageContainer width="narrow" className="space-y-8 pb-32 lg:pb-6">
      <PageHeader
        title="Upload pasco"
        description="Add exam papers for a course."
      />
      <PascoCreateGate>
        <Suspense fallback={<PascoCreateFormFallback />}>
          <PascoCreateForm />
        </Suspense>
      </PascoCreateGate>
    </PageContainer>
  );
}
