import { PageContainer } from "@/components/layout/page-container";
import { PascoCreateForm } from "@/components/pasco-create-form";
import { PascoCreateGate } from "@/components/pasco-create-gate";

export default function NewPascoPage() {
  return (
    <PageContainer width="narrow">
      <PascoCreateGate>
        <PascoCreateForm />
      </PascoCreateGate>
    </PageContainer>
  );
}
