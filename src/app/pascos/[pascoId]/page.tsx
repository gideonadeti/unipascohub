import type { Metadata } from "next";
import { cache } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PascoDetailPage } from "@/components/pasco-detail-page";
import { formatEnumLabel } from "@/lib/catalog-labels";
import { getCourseById } from "@/lib/courses";
import { prisma } from "@/lib/db";
import { getPascoDisplayTitle } from "@/lib/pasco-display";
import { getPascoById } from "@/lib/pascos";
import { breadcrumbJsonLd, pascoJsonLd } from "@/lib/seo/json-ld";

export const revalidate = 3600;
export const dynamicParams = true;

const getCachedPascoById = cache(getPascoById);

type PascoDetailRouteProps = {
  params: Promise<{ pascoId: string }>;
};

export async function generateStaticParams() {
  const pascos = await prisma.pasco.findMany({
    where: { moderationStatus: "PUBLISHED" },
    orderBy: { viewCount: "desc" },
    take: 100,
    select: { id: true },
  });

  return pascos.map((pasco) => ({ pascoId: pasco.id }));
}

export async function generateMetadata({
  params,
}: PascoDetailRouteProps): Promise<Metadata> {
  const { pascoId } = await params;
  const result = await getCachedPascoById(pascoId);

  if (!result.success) {
    return {
      title: "Pasco",
    };
  }

  const courseResult = await getCourseById(result.pasco.courseId);
  const course = courseResult.success ? courseResult.course : null;
  const title = getPascoDisplayTitle(result.pasco, course);

  const pasco = result.pasco;
  const courseLabel = course
    ? `${course.code} ${course.title}`
    : "past exam paper";
  const description = `Download ${courseLabel} ${formatEnumLabel(pasco.educationLevel)} ${formatEnumLabel(pasco.semesterType)} ${formatEnumLabel(pasco.type)} past questions (${pasco.academicYear}). Free university exam paper from Uni Pasco Hub.`;

  return {
    title,
    description,
    alternates: { canonical: `/pascos/${pascoId}` },
  };
}

async function getPascoData(pascoId: string) {
  const result = await getCachedPascoById(pascoId);

  if (!result.success) {
    return null;
  }

  const courseResult = await getCourseById(result.pasco.courseId);
  const course = courseResult.success ? courseResult.course : null;

  return { pasco: result.pasco, course };
}

export default async function PascoDetailRoute({
  params,
}: PascoDetailRouteProps) {
  const { pascoId } = await params;
  const data = await getPascoData(pascoId);

  const breadcrumb = data
    ? breadcrumbJsonLd([
        { name: "Home", href: "/" },
        { name: "Browse pascos", href: "/pascos" },
        {
          name: getPascoDisplayTitle(data.pasco, data.course),
          href: `/pascos/${pascoId}`,
        },
      ])
    : null;

  const pascoSchema = data ? pascoJsonLd(data.pasco, data.course) : null;

  return (
    <PageContainer width="narrow" className="space-y-8">
      {breadcrumb ? (
        <script
          type="application/ld+json"
          /* biome-ignore lint/security/noDangerouslySetInnerHtml: server-generated JSON-LD, no user input */
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
        />
      ) : null}
      {pascoSchema ? (
        <script
          type="application/ld+json"
          /* biome-ignore lint/security/noDangerouslySetInnerHtml: server-generated JSON-LD, no user input */
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pascoSchema) }}
        />
      ) : null}
      <PascoDetailPage />
    </PageContainer>
  );
}
