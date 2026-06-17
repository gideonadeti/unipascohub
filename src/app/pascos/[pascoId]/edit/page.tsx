import { PascoEditForm } from "@/components/pasco-edit-form";
import { PascoEditGate } from "@/components/pasco-edit-gate";

type EditPascoPageProps = {
  params: Promise<{ pascoId: string }>;
};

export default async function EditPascoPage({ params }: EditPascoPageProps) {
  const { pascoId } = await params;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-4">
      <PascoEditGate pascoId={pascoId}>
        <PascoEditForm pascoId={pascoId} />
      </PascoEditGate>
    </main>
  );
}
