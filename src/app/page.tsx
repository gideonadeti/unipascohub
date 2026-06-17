import type { Metadata } from "next";

import { HomeHero } from "@/components/home-hero";
import { PageContainer } from "@/components/layout/page-container";
import { PascoListSection } from "@/components/pasco-list-section";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { siteDescription } from "@/config/site";

export const metadata: Metadata = {
  title: "Home",
  description: siteDescription,
};

export default function HomePage() {
  return (
    <PageContainer width="default" className="space-y-12">
      <HomeHero />

      <div id="discover" className="scroll-mt-20 space-y-12">
        <RevealOnScroll>
          <PascoListSection
            title="Recent pascos"
            description="Latest uploads from contributors."
            filters={{ sortBy: "createdAt", sortOrder: "desc", limit: 6 }}
            emptyAction={{ label: "Upload a pasco", href: "/pascos/new" }}
            viewAllHref="/pascos"
          />
        </RevealOnScroll>

        <RevealOnScroll>
          <PascoListSection
            title="Popular pascos"
            description="Most viewed papers on the hub."
            filters={{ sortBy: "viewCount", sortOrder: "desc", limit: 6 }}
            emptyTitle="No popular pascos yet"
            emptyDescription="View counts will appear as students explore papers."
            viewAllHref="/pascos?sortBy=viewCount&sortOrder=desc"
          />
        </RevealOnScroll>
      </div>
    </PageContainer>
  );
}
