import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ProseContent } from "@/components/layout/prose-content";
import { Button } from "@/components/ui/button";
import { siteLinks } from "@/config/site";

export const metadata: Metadata = {
  title: "Sponsors",
  description: "Support Uni Pasco Hub and keep it running.",
};

export default function SponsorsPage() {
  return (
    <PageContainer width="default">
      <div className="space-y-8">
        <PageHeader
          title="Sponsors"
          description="Sponsorship helps cover hosting, storage, and ongoing maintenance."
        />

        <ProseContent>
          <p>
            Uni Pasco Hub is built to be simple, fast, and useful for students.
            Sponsorship keeps the lights on and helps us improve the experience
            over time.
          </p>
          <p>
            We will publish sponsor tiers and benefits in a future update. For
            now, you can support the project using the link below.
          </p>
        </ProseContent>

        {siteLinks.buyMeACoffee ? (
          <div>
            <Button asChild>
              <a
                href={siteLinks.buyMeACoffee}
                target="_blank"
                rel="noopener noreferrer"
              >
                Support on Buy Me a Coffee
              </a>
            </Button>
          </div>
        ) : (
          <ProseContent>
            <p>
              To add a sponsorship link, set{" "}
              <code className="text-foreground">NEXT_PUBLIC_BMC_URL</code>. In
              the meantime, you can reach us via{" "}
              <Link href="/feedback">Feedback</Link>.
            </p>
          </ProseContent>
        )}
      </div>
    </PageContainer>
  );
}
