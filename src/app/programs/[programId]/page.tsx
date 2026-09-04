import { notFound, redirect } from "next/navigation";
import { filtersToSearchParams } from "@/lib/pasco-list-query";
import { getProgramById } from "@/lib/programs";

type ProgramRouteProps = {
  params: Promise<{ programId: string }>;
};

export default async function ProgramRoute({ params }: ProgramRouteProps) {
  const { programId } = await params;
  const result = await getProgramById(programId);

  if (!result.success) {
    notFound();
  }

  const query = filtersToSearchParams({ programId });
  redirect(`/pascos?${query.toString()}`);
}
