import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATIC_ROUTES = [
  { url: "/", priority: 1.0, changeFrequency: "daily" as const },
  { url: "/pascos", priority: 0.9, changeFrequency: "hourly" as const },
  { url: "/feedback", priority: 0.4, changeFrequency: "monthly" as const },
  { url: "/contributors", priority: 0.3, changeFrequency: "monthly" as const },
  { url: "/sponsors", priority: 0.3, changeFrequency: "monthly" as const },
  { url: "/privacy", priority: 0.2, changeFrequency: "yearly" as const },
  { url: "/terms", priority: 0.2, changeFrequency: "yearly" as const },
];

const SITEMAP_PAGE_SIZE = 1000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `https://unipascohub.com${route.url}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const pascos = await prisma.pasco.findMany({
      where: { moderationStatus: "PUBLISHED" },
      orderBy: { id: "asc" },
      take: SITEMAP_PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: { id: true, updatedAt: true },
    });

    for (const pasco of pascos) {
      entries.push({
        url: `https://unipascohub.com/pascos/${pasco.id}`,
        lastModified: pasco.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    hasMore = pascos.length === SITEMAP_PAGE_SIZE;
    if (hasMore) {
      cursor = pascos[pascos.length - 1].id;
    }
  }

  return entries;
}
