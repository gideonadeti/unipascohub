type PascoCreateHrefParams = {
  institutionId: string;
  programId?: string;
  courseId?: string;
};

export function buildPascoCreateHref({
  institutionId,
  programId,
  courseId,
}: PascoCreateHrefParams): string {
  const params = new URLSearchParams({ institutionId });

  if (programId) {
    params.set("programId", programId);
  }

  if (courseId) {
    params.set("courseId", courseId);
  }

  return `/pascos/new?${params.toString()}`;
}
