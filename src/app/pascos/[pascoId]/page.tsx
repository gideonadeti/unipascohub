import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PascoDetailPage } from "@/components/pasco-detail-page";
import { siteDescription } from "@/config/site";
import { getCourseById } from "@/lib/courses";
import { getPascoDisplayTitle } from "@/lib/pasco-display";
import { getPascoById } from "@/lib/pascos";

type PascoDetailRouteProps = {
  params: Promise<{ pascoId: string }>;
};

export async function generateMetadata({
  params,
}: PascoDetailRouteProps): Promise<Metadata> {
  const { pascoId } = await params;
  const result = await getPascoById(pascoId);

  if (!result.success) {
    return {
      title: "Pasco",
      description: siteDescription,
    };
  }

  const courseResult = await getCourseById(result.pasco.courseId);
  const course = courseResult.success ? courseResult.course : null;
  const title = getPascoDisplayTitle(result.pasco, course);

  return {
    title,
    description: siteDescription,
  };
}

export default function PascoDetailRoute() {
  return (
    <PageContainer width="narrow" className="space-y-8">
      <PascoDetailPage />
    </PageContainer>
  );
}
