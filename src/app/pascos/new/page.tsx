import { PascoCreateForm } from "@/components/pasco-create-form";
import { PascoCreateGate } from "@/components/pasco-create-gate";

export default function NewPascoPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-4">
      <PascoCreateGate>
        <PascoCreateForm />
      </PascoCreateGate>
    </main>
  );
}
