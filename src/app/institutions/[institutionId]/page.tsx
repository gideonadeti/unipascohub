import { notFound, redirect } from "next/navigation";

import { getInstitutionById } from "@/lib/institutions";
import { filtersToSearchParams } from "@/lib/pasco-list-query";

type InstitutionRouteProps = {
  params: Promise<{ institutionId: string }>;
};

export default async function InstitutionRoute({
  params,
}: InstitutionRouteProps) {
  const { institutionId } = await params;
  const result = await getInstitutionById(institutionId);

  if (!result.success) {
    notFound();
  }

  const query = filtersToSearchParams({ institutionId });
  redirect(`/pascos?${query.toString()}`);
}
