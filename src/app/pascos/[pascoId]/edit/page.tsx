import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PascoEditForm } from "@/components/pasco-edit-form";
import { PascoEditGate } from "@/components/pasco-edit-gate";
import { PascoPageNav } from "@/components/pasco-page-nav";
import { Button } from "@/components/ui/button";
import { siteDescription } from "@/config/site";

export const metadata: Metadata = {
  title: "Edit pasco",
  description: siteDescription,
};

type EditPascoPageProps = {
  params: Promise<{ pascoId: string }>;
};

export default async function EditPascoPage({ params }: EditPascoPageProps) {
  const { pascoId } = await params;

  return (
    <PageContainer width="narrow" className="space-y-8 pb-32 lg:pb-6">
      <PageHeader
        title="Edit pasco"
        description="Update metadata or manage files for this pasco."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/pascos/${pascoId}`}>Cancel</Link>
          </Button>
        }
      />
      <PascoPageNav href={`/pascos/${pascoId}`} label="Back to pasco" />
      <PascoEditGate pascoId={pascoId}>
        <PascoEditForm pascoId={pascoId} />
      </PascoEditGate>
    </PageContainer>
  );
}
