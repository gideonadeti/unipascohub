"use client";

import { useInstitutions } from "@/hooks/api/use-institutions";
import { usePascosList } from "@/hooks/api/use-pascos";

export function ApiSmokeTest() {
  const institutions = useInstitutions();
  const pascos = usePascosList();

  return (
    <div className="p-4 space-y-4 text-sm">
      <section>
        <h2 className="font-medium">Institutions</h2>
        {institutions.isPending && <p>Loading institutions…</p>}
        {institutions.error && (
          <p className="text-red-600">Error: {institutions.error.message}</p>
        )}
        {institutions.data && (
          <p>{institutions.data.institutions.length} institution(s)</p>
        )}
      </section>

      <section>
        <h2 className="font-medium">Pascos</h2>
        {pascos.isPending && <p>Loading pascos…</p>}
        {pascos.error && (
          <p className="text-red-600">Error: {pascos.error.message}</p>
        )}
        {pascos.data && (
          <p>
            {pascos.data.pascos.length} pasco(s) on page{" "}
            {pascos.data.pagination.page} of {pascos.data.pagination.totalPages}
          </p>
        )}
      </section>
    </div>
  );
}
