import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PascoBrowsePage } from "@/components/pasco-browse-page";
import { PascoListSkeleton } from "@/components/pasco-list-skeleton";
import { siteDescription } from "@/config/site";
import {
  BROWSE_DEFAULT_LIMIT,
  parseListPascosQuery,
} from "@/lib/pasco-list-query";
import { getPascoListResponse } from "@/lib/pascos";
import type { PascoListResponse } from "@/types/api/pascos";

type BrowsePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toURLSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry);
      }
      continue;
    }

    params.set(key, value);
  }

  return params;
}

async function prefetchPascoList(
  searchParams: Record<string, string | string[] | undefined>,
): Promise<PascoListResponse | undefined> {
  const parsed = parseListPascosQuery(toURLSearchParams(searchParams), {
    defaultLimit: BROWSE_DEFAULT_LIMIT,
  });

  if (!parsed.success || parsed.data.q) {
    return undefined;
  }

  return (await getPascoListResponse(parsed.data)) ?? undefined;
}

export async function generateMetadata({
  searchParams,
}: BrowsePageProps): Promise<Metadata> {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : undefined;

  if (query) {
    return {
      title: `"${query}" past exam papers`,
      description: `Browse past exam papers matching "${query}". Free university past questions from Uni Pasco Hub.`,
    };
  }

  return {
    title: "Browse pascos",
    description: siteDescription,
  };
}

export default async function BrowsePascosPage({
  searchParams,
}: BrowsePageProps) {
  const sp = await searchParams;
  const initialData = await prefetchPascoList(sp);

  return (
    <PageContainer width="default" className="space-y-8">
      <PageHeader
        title="Browse pascos"
        description="Filter and discover past exam papers shared by students."
      />
      <Suspense fallback={<PascoListSkeleton count={12} />}>
        <PascoBrowsePage initialData={initialData} />
      </Suspense>
    </PageContainer>
  );
}
