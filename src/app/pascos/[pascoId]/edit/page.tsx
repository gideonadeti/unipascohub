import { PageContainer } from "@/components/layout/page-container";
import { PascoEditForm } from "@/components/pasco-edit-form";
import { PascoEditGate } from "@/components/pasco-edit-gate";

type EditPascoPageProps = {
  params: Promise<{ pascoId: string }>;
};

export default async function EditPascoPage({ params }: EditPascoPageProps) {
  const { pascoId } = await params;

  return (
    <PageContainer width="narrow">
      <PascoEditGate pascoId={pascoId}>
        <PascoEditForm pascoId={pascoId} />
      </PascoEditGate>
    </PageContainer>
  );
}
