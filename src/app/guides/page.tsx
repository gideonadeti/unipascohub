import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { browsingGuide } from "@/content/guides/browsing";
import { uploadingGuide } from "@/content/guides/uploading";

export const metadata: Metadata = {
  title: "Guides",
  description: "How to find and share past exam papers on Uni Pasco Hub.",
};

const guides = [
  {
    href: "/guides/browsing",
    title: browsingGuide.title,
    description: browsingGuide.description,
  },
  {
    href: "/guides/uploading",
    title: uploadingGuide.title,
    description: uploadingGuide.description,
  },
];

export default function GuidesPage() {
  return (
    <PageContainer width="narrow">
      <div className="space-y-8">
        <PageHeader
          title="Guides"
          description="Straight answers on using Uni Pasco Hub."
        />
        <div className="space-y-4">
          {guides.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="block rounded-lg border p-4 transition-colors hover:border-primary"
            >
              <h2 className="text-lg font-medium text-foreground">
                {guide.title}
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                {guide.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
