import type { Metadata } from "next";

import { HomeHero } from "@/components/home-hero";
import { PageContainer } from "@/components/layout/page-container";
import { PascoListSection } from "@/components/pasco-list-section";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { siteDescription, siteName, siteUrl } from "@/config/site";
import { serializeJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Home",
  description: siteDescription,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  description: siteDescription,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/pascos?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function HomePage() {
  return (
    <PageContainer width="default" className="space-y-12">
      <script
        type="application/ld+json"
        /* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD serialized via serializeJsonLd (escapes <, >, &, line separators) */
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteSchema) }}
      />
      <HomeHero />

      <div id="discover" className="scroll-mt-20 space-y-12">
        <RevealOnScroll>
          <PascoListSection
            title="Recent pascos"
            description="Latest uploads from contributors."
            filters={{ sortBy: "createdAt", sortOrder: "desc", limit: 6 }}
            emphasize="createdAt"
            emptyAction={{ label: "Upload a pasco", href: "/pascos/new" }}
            viewAllHref="/pascos"
          />
        </RevealOnScroll>

        <RevealOnScroll>
          <PascoListSection
            title="Popular pascos"
            description="Most viewed papers on the hub."
            filters={{ sortBy: "viewCount", sortOrder: "desc", limit: 6 }}
            emphasize="views"
            emptyTitle="No popular pascos yet"
            emptyDescription="View counts will appear as students explore papers."
            viewAllHref="/pascos?sortBy=viewCount&sortOrder=desc"
          />
        </RevealOnScroll>
      </div>
    </PageContainer>
  );
}
