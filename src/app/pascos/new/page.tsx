import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PascoCreateForm } from "@/components/pasco-create-form";
import { PascoCreateGate } from "@/components/pasco-create-gate";
import { siteDescription } from "@/config/site";

export const metadata: Metadata = {
  title: "Upload pasco",
  description: siteDescription,
};

export default function NewPascoPage() {
  return (
    <PageContainer width="narrow" className="space-y-8">
      <PageHeader
        title="Upload pasco"
        description="Add exam papers for a course. Files are uploaded to Cloudinary before submission."
      />
      <PascoCreateGate>
        <PascoCreateForm />
      </PascoCreateGate>
    </PageContainer>
  );
}
